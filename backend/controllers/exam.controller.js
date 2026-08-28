import Exam from "../models/Exam.js";
import Submission from "../models/Submission.js";
import Classroom from "../models/Classroom.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import ApiError from "../utils/apiError.js";
import { getExamWindow, examStatusFor, autoGradeSubmission, analyzeSubmission, analyzeClassPerformance } from "../services/exam.service.js";

const isAssigned = (user, classroomId, subject) =>
  (user.facultyAssignments || []).some(
    (a) => a.classroom.toString() === classroomId.toString() && a.subject === subject
  );

// ══════════════════════════ Faculty ════════════════════════════════

// ── POST /api/exams ─────────────────────────────────────────────────
export const createExam = asyncHandler(async (req, res) => {
  const { title, subject, classroom, instructions, questions, durationMinutes, scheduledAt } = req.body;

  if (!title || !subject || !classroom || !durationMinutes || !scheduledAt) {
    throw new ApiError(400, "title, subject, classroom, durationMinutes and scheduledAt are required.");
  }
  if (!isAssigned(req.user, classroom, subject)) {
    throw new ApiError(403, "You aren't assigned to teach this subject for this class.");
  }

  // Always starts as a draft — publishing to students requires admin
  // approval (see submitForApproval / adminApproveExam below).
  const exam = await Exam.create({
    title,
    subject,
    classroom,
    faculty: req.user._id,
    instructions,
    questions,
    durationMinutes,
    scheduledAt,
    status: "draft",
  });

  return sendResponse(res, 201, "Exam created.", { exam });
});

// ── PATCH /api/exams/:id ─────────────────────────────────────────────
// Only editable while still a draft or rejected (i.e. not awaiting/past review).
export const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, faculty: req.user._id });
  if (!exam) throw new ApiError(404, "Exam not found.");
  if (!["draft", "rejected"].includes(exam.status)) {
    throw new ApiError(409, "Only draft or rejected exams can be edited.");
  }

  const editable = ["title", "subject", "instructions", "questions", "durationMinutes", "scheduledAt"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) exam[field] = req.body[field];
  });
  await exam.save();

  return sendResponse(res, 200, "Exam updated.", { exam });
});

// ── PATCH /api/exams/:id/submit-for-approval ─────────────────────────
// Faculty can't publish directly — this sends the exam to the admin queue.
export const submitForApproval = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, faculty: req.user._id });
  if (!exam) throw new ApiError(404, "Exam not found.");
  if (!["draft", "rejected"].includes(exam.status)) {
    throw new ApiError(409, "This exam has already been submitted or published.");
  }

  exam.status = "pending_approval";
  exam.rejectionReason = "";
  await exam.save();

  return sendResponse(res, 200, "Submitted for admin approval.", { exam });
});

// ── GET /api/exams/faculty ───────────────────────────────────────────
export const listFacultyExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ faculty: req.user._id })
    .populate("classroom", "className")
    .sort({ scheduledAt: -1 })
    .lean();

  const withCounts = await Promise.all(
    exams.map(async (exam) => {
      const submittedCount = await Submission.countDocuments({
        exam: exam._id,
        status: { $ne: "in_progress" },
      });
      return {
        ...exam,
        liveStatus: examStatusFor(exam),
        submittedCount,
      };
    })
  );

  return sendResponse(res, 200, "Exams fetched.", { exams: withCounts });
});

// ── GET /api/exams/:id/submissions ───────────────────────────────────
export const getExamSubmissions = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, faculty: req.user._id }).lean();
  if (!exam) throw new ApiError(404, "Exam not found.");

  const submissions = await Submission.find({ exam: exam._id })
    .populate("student", "firstName lastName rollNumber")
    .sort({ "student.rollNumber": 1 })
    .lean();

  return sendResponse(res, 200, "Submissions fetched.", { exam, submissions });
});

// ── PATCH /api/exams/submissions/:submissionId/grade ─────────────────
// Body: { marks: [{ questionId, awardedMarks }] } — subjective questions only.
export const gradeSubmission = asyncHandler(async (req, res) => {
  const { marks } = req.body;
  if (!Array.isArray(marks)) throw new ApiError(400, "marks[] is required.");

  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) throw new ApiError(404, "Submission not found.");

  const exam = await Exam.findOne({ _id: submission.exam, faculty: req.user._id });
  if (!exam) throw new ApiError(403, "Not your exam.");

  const marksMap = new Map(marks.map((m) => [m.questionId, m.awardedMarks]));
  const questionMaxMarks = new Map(exam.questions.map((q) => [q._id.toString(), q.marks]));

  submission.answers = submission.answers.map((ans) => {
    if (marksMap.has(ans.question.toString())) {
      const max = questionMaxMarks.get(ans.question.toString()) ?? Infinity;
      const awarded = Math.max(0, Math.min(Number(marksMap.get(ans.question.toString())), max));
      ans.awardedMarks = awarded;
    }
    return ans;
  });

  const allGraded = submission.answers.every((a) => a.awardedMarks !== null);
  submission.manualScore = submission.answers
    .filter((a) => a.awardedMarks !== null)
    .reduce((sum, a) => sum + a.awardedMarks, 0);
  submission.finalScore = submission.manualScore; // manualScore already includes auto-graded MCQ marks
  submission.status = allGraded ? "graded" : "pending_review";

  await submission.save();

  return sendResponse(res, 200, "Grades saved.", { submission });
});

// ── PATCH /api/exams/:id/publish-results ─────────────────────────────
export const publishResults = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, faculty: req.user._id });
  if (!exam) throw new ApiError(404, "Exam not found.");

  exam.resultsPublished = true;
  await exam.save();

  return sendResponse(res, 200, "Results published to students.");
});

// ── GET /api/exams/:id/analytics ──────────────────────────────────────
// Teacher-facing: class-wide topic-strength breakdown across all attempts.
export const getClassAnalytics = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, faculty: req.user._id }).lean();
  if (!exam) throw new ApiError(404, "Exam not found.");

  const submissions = await Submission.find({ exam: exam._id }).lean();
  const analytics = analyzeClassPerformance(exam, submissions);

  return sendResponse(res, 200, "Analytics fetched.", { analytics });
});

// ══════════════════════════ Admin: test approval ═══════════════════

// ── GET /api/exams/admin/pending ─────────────────────────────────────
export const adminListPendingExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ status: "pending_approval" })
    .populate("classroom", "className")
    .populate("faculty", "firstName lastName")
    .sort({ createdAt: 1 })
    .lean();

  return sendResponse(res, 200, "Pending exams fetched.", { exams });
});

// ── PATCH /api/exams/admin/:id/approve ───────────────────────────────
export const adminApproveExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, status: "pending_approval" });
  if (!exam) throw new ApiError(404, "No pending exam with that id.");

  exam.status = "published";
  exam.reviewedBy = req.user._id;
  exam.reviewedAt = new Date();
  await exam.save();

  return sendResponse(res, 200, "Exam approved and published to students.", { exam });
});

// ── PATCH /api/exams/admin/:id/reject ────────────────────────────────
// Body: { reason }
export const adminRejectExam = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const exam = await Exam.findOne({ _id: req.params.id, status: "pending_approval" });
  if (!exam) throw new ApiError(404, "No pending exam with that id.");

  exam.status = "rejected";
  exam.rejectionReason = reason || "No reason given.";
  exam.reviewedBy = req.user._id;
  exam.reviewedAt = new Date();
  await exam.save();

  return sendResponse(res, 200, "Exam rejected.", { exam });
});

// ══════════════════════════ Student ════════════════════════════════

// ── GET /api/exams/my ─────────────────────────────────────────────────
export const listMyExams = asyncHandler(async (req, res) => {
  if (!req.user.classroom) {
    return sendResponse(res, 200, "No classroom assigned.", { exams: [] });
  }

  const exams = await Exam.find({ classroom: req.user.classroom, status: "published" })
    .select("-questions.correctOptionIndex")
    .sort({ scheduledAt: -1 })
    .lean();

  const submissions = await Submission.find({
    exam: { $in: exams.map((e) => e._id) },
    student: req.user._id,
  }).lean();
  const submissionByExam = new Map(submissions.map((s) => [s.exam.toString(), s]));

  return sendResponse(res, 200, "Exams fetched.", {
    exams: exams.map((exam) => {
      const submission = submissionByExam.get(exam._id.toString());
      return {
        ...exam,
        liveStatus: examStatusFor(exam),
        mySubmission: submission
          ? {
              status: submission.status,
              submittedAt: submission.submittedAt,
              finalScore: exam.resultsPublished ? submission.finalScore : null,
            }
          : null,
      };
    }),
  });
});

// ── POST /api/exams/:id/start ──────────────────────────────────────────
export const startExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    _id: req.params.id,
    classroom: req.user.classroom,
    status: "published",
  }).lean();
  if (!exam) throw new ApiError(404, "Exam not found.");

  const liveStatus = examStatusFor(exam);
  if (liveStatus !== "live") {
    throw new ApiError(409, `This exam is ${liveStatus}, not open right now.`);
  }

  let submission = await Submission.findOne({ exam: exam._id, student: req.user._id });
  if (submission && submission.status !== "in_progress") {
    throw new ApiError(409, "You've already submitted this exam.");
  }
  if (!submission) {
    submission = await Submission.create({
      exam: exam._id,
      student: req.user._id,
      answers: exam.questions.map((q) => ({ question: q._id })),
    });
  }

  const { closesAt } = getExamWindow(exam);

  // Strip the answer key before sending to the student.
  const safeQuestions = exam.questions.map(({ correctOptionIndex, ...q }) => q);

  return sendResponse(res, 200, "Exam started.", {
    exam: { ...exam, questions: safeQuestions },
    submission,
    closesAt,
  });
});

// ── POST /api/exams/:id/submit ────────────────────────────────────────
// Body: { answers: [{ questionId, selectedOptionIndex?, textAnswer? }] }
export const submitExam = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  if (!Array.isArray(answers)) throw new ApiError(400, "answers[] is required.");

  const exam = await Exam.findOne({ _id: req.params.id, classroom: req.user.classroom });
  if (!exam) throw new ApiError(404, "Exam not found.");

  const liveStatus = examStatusFor(exam);
  if (liveStatus === "upcoming") throw new ApiError(409, "This exam hasn't started yet.");

  const submission = await Submission.findOne({ exam: exam._id, student: req.user._id });
  if (!submission) throw new ApiError(404, "Start the exam before submitting.");
  if (submission.status !== "in_progress") {
    throw new ApiError(409, "You've already submitted this exam.");
  }

  const answerMap = new Map(answers.map((a) => [a.questionId, a]));
  submission.answers = submission.answers.map((ans) => {
    const incoming = answerMap.get(ans.question.toString());
    if (!incoming) return ans;
    return {
      question: ans.question,
      selectedOptionIndex: incoming.selectedOptionIndex ?? null,
      textAnswer: incoming.textAnswer ?? "",
      awardedMarks: null,
    };
  });

  const { answers: gradedAnswers, autoScore, hasUngraded } = autoGradeSubmission(exam, submission);
  submission.answers = gradedAnswers;
  submission.autoScore = autoScore;
  submission.submittedAt = new Date();

  if (hasUngraded) {
    submission.status = "pending_review";
  } else {
    submission.status = "graded";
    submission.finalScore = autoScore;
    submission.manualScore = autoScore;
  }

  await submission.save();

  return sendResponse(res, 200, "Exam submitted.", {
    submission,
    autoScore,
    needsManualGrading: hasUngraded,
  });
});

// ── GET /api/exams/:id/analysis ────────────────────────────────────────
// Student-facing: their own performance breakdown, once results are published.
export const getMyAnalysis = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, classroom: req.user.classroom }).lean();
  if (!exam) throw new ApiError(404, "Exam not found.");
  if (!exam.resultsPublished) {
    throw new ApiError(409, "Results haven't been published for this exam yet.");
  }

  const submission = await Submission.findOne({ exam: exam._id, student: req.user._id }).lean();
  if (!submission || submission.status === "in_progress") {
    throw new ApiError(404, "You don't have a submission for this exam.");
  }

  const analysis = analyzeSubmission(exam, submission);
  return sendResponse(res, 200, "Analysis fetched.", { analysis });
});
