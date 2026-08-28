import Note from "../models/Note.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import ApiError from "../utils/apiError.js";

const isAssigned = (user, classroomId, subject) =>
  (user.facultyAssignments || []).some(
    (a) => a.classroom.toString() === classroomId.toString() && a.subject === subject
  );

// ── POST /api/notes ─────────────────────────────────────────────────
export const uploadNote = asyncHandler(async (req, res) => {
  const { title, description, subject, classroom, fileUrl } = req.body;
  if (!title || !subject || !classroom || !fileUrl) {
    throw new ApiError(400, "title, subject, classroom and fileUrl are required.");
  }
  if (!isAssigned(req.user, classroom, subject)) {
    throw new ApiError(403, "You aren't assigned to teach this subject for this class.");
  }

  const note = await Note.create({
    title,
    description: description || "",
    subject,
    classroom,
    faculty: req.user._id,
    fileUrl,
  });

  return sendResponse(res, 201, "Note uploaded.", { note });
});

// ── DELETE /api/notes/:id ─────────────────────────────────────────────
export const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, faculty: req.user._id });
  if (!note) throw new ApiError(404, "Note not found.");
  return sendResponse(res, 200, "Note deleted.");
});

// ── GET /api/notes/faculty ────────────────────────────────────────────
export const listFacultyNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({ faculty: req.user._id })
    .populate("classroom", "className")
    .sort({ createdAt: -1 })
    .lean();
  return sendResponse(res, 200, "Notes fetched.", { notes });
});

// ── GET /api/notes/my ──────────────────────────────────────────────────
// Query: ?subject=
export const listMyNotes = asyncHandler(async (req, res) => {
  if (!req.user.classroom) {
    return sendResponse(res, 200, "No classroom assigned.", { notes: [] });
  }
  const filter = { classroom: req.user.classroom };
  if (req.query.subject) filter.subject = req.query.subject;

  const notes = await Note.find(filter)
    .populate("faculty", "firstName lastName")
    .sort({ createdAt: -1 })
    .lean();

  return sendResponse(res, 200, "Notes fetched.", { notes });
});
