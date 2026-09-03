// resource controller

import Classroom from "../models/Classroom.js";
import Deadline from "../models/Deadline.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";

import ApiError from "../utils/apiError.js";

// TODO: implement controller functions
export const getClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.user.classroom);

  if (!classroom) {
    return res
      .status(404)
      .json({ success: false, message: "Classroom context not found." });
  }

  // Defensively convert to string variables to evaluate matching states safely
  const repIdStr = classroom.classRepresentative?.toString();
  const userIdStr = req.user._id?.toString();

  // Compute validation boolean flag state
  const isClassRep =
    req.user.role === "superadmin" ||
    (repIdStr !== undefined && repIdStr === userIdStr);

  return sendResponse(res, 200, "Classroom fetched successfully", {
    classroom,
    isClassRep, // Returns clean explicitly typed true/false boolean primitive
  });
});

export const upsertDeadline = asyncHandler(async (req, res) => {
  const { classroomId, deadlineId } = req.params;
  const { title, description, type, dueDate } = req.body;

  if (deadlineId) {
    const updatedDeadline = await Deadline.findOneAndUpdate(
      { _id: deadlineId },
      {
        title,
        description,
        type,
        dueDate,
        classroom: classroomId,
        postedBy: req.user._id,
      },
      { new: true, runValidators: true },
    );
    if (!updatedDeadline) {
      return res.status(404).json({ message: "Deadline not found." });
    }
    return sendResponse(
      res,
      200,
      "deadline updated successfully",
      updatedDeadline,
    );
  }

  const newDeadline = await Deadline.create({
    ...req.body,
    postedBy: req.user._id,
    classroom: classroomId,
  });
  sendResponse(res, 201, "deadline created successfully", newDeadline);
});

export const getDeadlines = asyncHandler(async (req, res) => {
  const data = await Deadline.find({
    classroom: req.params.id,
  });
  sendResponse(res, 200, "deadlines fetched", data);
});

export const deletDeadline = asyncHandler(async (req, res) => {
  const data = await Deadline.findByIdAndDelete(req.params.deadlineId);
  if (!data) sendResponse(res, 404, "deadline doesnt exist");
  sendResponse(res, 200, "deadline deleted", data);
});

// ══════════════════════════ Admin: manage classrooms ═══════════════
// This is the missing piece that unblocks everything downstream —
// faculty assignments, exams, assignments, notes, attendance timetables
// all depend on a Classroom existing first, and there was previously no
// way to create one anywhere in the app.

// ── GET /api/classroom/admin/all ─────────────────────────────────────
export const adminListAllClassrooms = asyncHandler(async (req, res) => {
  const classrooms = await Classroom.find()
    .select("className branch year section students timetable")
    .sort({ className: 1 })
    .lean();

  return sendResponse(res, 200, "Classrooms fetched.", {
    classrooms: classrooms.map((c) => ({
      ...c,
      studentCount: c.students?.length || 0,
    })),
  });
});

// ── POST /api/classroom/admin/create ─────────────────────────────────
// Body: { className, branch, year, section }
export const adminCreateClassroom = asyncHandler(async (req, res) => {
  const { className, branch, year, section } = req.body;

  if (!className || !branch || !year) {
    throw new ApiError(400, "className, branch and year are required.");
  }

  const existing = await Classroom.findOne({ className });
  if (existing) {
    throw new ApiError(409, "A classroom with that name already exists.");
  }

  const classroom = await Classroom.create({
    className,
    branch,
    year: Number(year),
    section: section || "",
  });

  return sendResponse(res, 201, "Classroom created.", { classroom });
});

// ── DELETE /api/classroom/admin/:id ───────────────────────────────────
export const adminDeleteClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findByIdAndDelete(req.params.id);
  if (!classroom) throw new ApiError(404, "Classroom not found.");
  return sendResponse(res, 200, "Classroom deleted.");
});

// ── POST /api/classroom/admin/:id/periods ─────────────────────────────
// Body: { day, subject, faculty, room, startTime, endTime }
// Adds one timetable period for a given weekday — this is what powers
// "is there a class happening right now" for attendance + exams.
export const adminAddPeriod = asyncHandler(async (req, res) => {
  const { day, subject, faculty, room, startTime, endTime } = req.body;
  const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  if (!validDays.includes(day)) throw new ApiError(400, "Invalid day.");
  if (!subject || !faculty || !startTime || !endTime) {
    throw new ApiError(400, "subject, faculty, startTime and endTime are required.");
  }

  const classroom = await Classroom.findById(req.params.id);
  if (!classroom) throw new ApiError(404, "Classroom not found.");

  classroom.timetable[day].push({ subject, faculty, room: room || "", startTime, endTime });
  await classroom.save();

  return sendResponse(res, 201, "Period added.", { classroom });
});

// ── DELETE /api/classroom/admin/:id/periods/:day/:index ────────────────
export const adminRemovePeriod = asyncHandler(async (req, res) => {
  const { id, day, index } = req.params;
  const classroom = await Classroom.findById(id);
  if (!classroom) throw new ApiError(404, "Classroom not found.");

  const periods = classroom.timetable[day];
  if (!periods || !periods[index]) throw new ApiError(404, "Period not found.");

  periods.splice(Number(index), 1);
  await classroom.save();

  return sendResponse(res, 200, "Period removed.", { classroom });
});