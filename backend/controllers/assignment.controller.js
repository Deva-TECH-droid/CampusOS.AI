import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import ApiError from "../utils/apiError.js";

const isAssigned = (user, classroomId, subject) =>
  (user.facultyAssignments || []).some(
    (a) => a.classroom.toString() === classroomId.toString() && a.subject === subject
  );

// ══════════════════════════ Faculty ════════════════════════════════

// ── POST /api/assignments ─────────────────────────────────────────────
export const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, subject, classroom, attachmentUrl, maxMarks, dueDate } = req.body;

  if (!title || !description || !subject || !classroom || !dueDate) {
    throw new ApiError(400, "title, description, subject, classroom and dueDate are required.");
  }
  if (!isAssigned(req.user, classroom, subject)) {
    throw new ApiError(403, "You aren't assigned to teach this subject for this class.");
  }

  const assignment = await Assignment.create({
    title,
    description,
    subject,
    classroom,
    faculty: req.user._id,
    attachmentUrl: attachmentUrl || "",
    maxMarks: maxMarks || 10,
    dueDate,
  });

  return sendResponse(res, 201, "Assignment created.", { assignment });
});

// ── PATCH /api/assignments/:id ────────────────────────────────────────
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, faculty: req.user._id });
  if (!assignment) throw new ApiError(404, "Assignment not found.");

  const editable = ["title", "description", "attachmentUrl", "maxMarks", "dueDate"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) assignment[field] = req.body[field];
  });
  await assignment.save();

  return sendResponse(res, 200, "Assignment updated.", { assignment });
});

// ── DELETE /api/assignments/:id ────────────────────────────────────────
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, faculty: req.user._id });
  if (!assignment) throw new ApiError(404, "Assignment not found.");
  await AssignmentSubmission.deleteMany({ assignment: assignment._id });
  return sendResponse(res, 200, "Assignment deleted.");
});

// ── GET /api/assignments/faculty ────────────────────────────────────────
export const listFacultyAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ faculty: req.user._id })
    .populate("classroom", "className")
    .sort({ dueDate: -1 })
    .lean();

  const withCounts = await Promise.all(
    assignments.map(async (a) => {
      const submittedCount = await AssignmentSubmission.countDocuments({ assignment: a._id });
      const gradedCount = await AssignmentSubmission.countDocuments({
        assignment: a._id,
        status: "graded",
      });
      return { ...a, submittedCount, gradedCount };
    })
  );

  return sendResponse(res, 200, "Assignments fetched.", { assignments: withCounts });
});

// ── GET /api/assignments/:id/submissions ────────────────────────────────
export const getSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, faculty: req.user._id }).lean();
  if (!assignment) throw new ApiError(404, "Assignment not found.");

  const submissions = await AssignmentSubmission.find({ assignment: assignment._id })
    .populate("student", "firstName lastName rollNumber")
    .sort({ submittedAt: -1 })
    .lean();

  return sendResponse(res, 200, "Submissions fetched.", { assignment, submissions });
});

// ── PATCH /api/assignments/submissions/:submissionId/grade ──────────────
// Body: { marks, feedback }
export const gradeSubmission = asyncHandler(async (req, res) => {
  const { marks, feedback } = req.body;
  const submission = await AssignmentSubmission.findById(req.params.submissionId);
  if (!submission) throw new ApiError(404, "Submission not found.");

  const assignment = await Assignment.findOne({ _id: submission.assignment, faculty: req.user._id });
  if (!assignment) throw new ApiError(403, "Not your assignment.");

  submission.marks = Math.max(0, Math.min(Number(marks), assignment.maxMarks));
  submission.feedback = feedback || "";
  submission.status = "graded";
  submission.gradedAt = new Date();
  await submission.save();

  return sendResponse(res, 200, "Grade saved.", { submission });
});

// ══════════════════════════ Student ════════════════════════════════

// ── GET /api/assignments/my ─────────────────────────────────────────────
export const listMyAssignments = asyncHandler(async (req, res) => {
  if (!req.user.classroom) {
    return sendResponse(res, 200, "No classroom assigned.", { assignments: [] });
  }

  const assignments = await Assignment.find({ classroom: req.user.classroom })
    .populate("faculty", "firstName lastName")
    .sort({ dueDate: -1 })
    .lean();

  const submissions = await AssignmentSubmission.find({
    assignment: { $in: assignments.map((a) => a._id) },
    student: req.user._id,
  }).lean();
  const submissionByAssignment = new Map(submissions.map((s) => [s.assignment.toString(), s]));

  return sendResponse(res, 200, "Assignments fetched.", {
    assignments: assignments.map((a) => ({
      ...a,
      isOverdue: new Date() > new Date(a.dueDate),
      mySubmission: submissionByAssignment.get(a._id.toString()) || null,
    })),
  });
});

// ── POST /api/assignments/:id/submit ────────────────────────────────────
// Body: { textAnswer?, fileUrl? }
export const submitAssignment = asyncHandler(async (req, res) => {
  const { textAnswer, fileUrl } = req.body;
  if (!textAnswer && !fileUrl) {
    throw new ApiError(400, "Provide a text answer or a file.");
  }

  const assignment = await Assignment.findOne({
    _id: req.params.id,
    classroom: req.user.classroom,
  });
  if (!assignment) throw new ApiError(404, "Assignment not found.");

  const isLate = new Date() > new Date(assignment.dueDate);

  const submission = await AssignmentSubmission.findOneAndUpdate(
    { assignment: assignment._id, student: req.user._id },
    {
      assignment: assignment._id,
      student: req.user._id,
      textAnswer: textAnswer || "",
      fileUrl: fileUrl || "",
      submittedAt: new Date(),
      isLate,
      // Resubmitting resets any existing grade — it's a new answer.
      marks: null,
      feedback: "",
      status: "submitted",
      gradedAt: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return sendResponse(res, 200, "Assignment submitted.", { submission });
});
