import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";

// ─── POST /api/internal/chatbot/deadlines ──────────────────────────────────
// Tool: "what assignments are due soon". Mirrors the scoping logic in
// assignment.controller.js's listMyAssignments (classroom match, submission
// lookup, isOverdue flag) — deliberately NOT importing that controller
// function directly, since it's shaped for an HTTP response to a student,
// not for an LLM tool result. Same rules, different output shape.
export const getUpcomingDeadlines = asyncHandler(async (req, res) => {
  const { classroom, userId } = req.chatUser;

  if (!classroom) {
    return sendResponse(res, 200, "No classroom assigned.", { deadlines: [] });
  }

  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const assignments = await Assignment.find({
    classroom,
    dueDate: { $lte: sevenDaysOut },
  })
    .sort({ dueDate: 1 })
    .lean();

  const submissions = await AssignmentSubmission.find({
    assignment: { $in: assignments.map((a) => a._id) },
    student: userId,
  }).lean();
  const submittedIds = new Set(submissions.map((s) => s.assignment.toString()));

  // Only surface what's actually still relevant to a "what's due" question:
  // not-yet-submitted assignments, whether overdue or upcoming. Already-
  // submitted ones would just be noise in a chat answer.
  const deadlines = assignments
    .filter((a) => !submittedIds.has(a._id.toString()))
    .map((a) => ({
      title: a.title,
      subject: a.subject,
      dueDate: a.dueDate,
      isOverdue: now > new Date(a.dueDate),
    }));

  return sendResponse(res, 200, "Deadlines fetched.", { deadlines });
});