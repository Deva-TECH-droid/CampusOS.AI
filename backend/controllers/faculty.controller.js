import mongoose from "mongoose";
import User from "../models/User.js";
import Classroom from "../models/Classroom.js";
import Attendance from "../models/Attendance.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import ApiError from "../utils/apiError.js";
import { startOfDay, dayNameFromDate } from "../services/attendance.service.js";
import { streamAttendanceExcel } from "../utils/excel.js";

const isAssigned = (user, classroomId, subject) =>
  (user.facultyAssignments || []).some(
    (a) => a.classroom.toString() === classroomId.toString() && a.subject === subject
  );

// ── GET /api/faculty/assignments ──────────────────────────────────
// A faculty member's own teaching assignments, for populating dropdowns.
export const myAssignments = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("facultyAssignments.classroom", "className branch year section")
    .lean();

  return sendResponse(res, 200, "Assignments fetched.", {
    assignments: user.facultyAssignments || [],
  });
});

// ── GET /api/faculty/roster ────────────────────────────────────────
// Query: classroomId, subject, date? — the class list + today's status,
// for the "mark attendance" screen.
export const getRoster = asyncHandler(async (req, res) => {
  const { classroomId, subject, date } = req.query;
  if (!classroomId || !subject) {
    throw new ApiError(400, "classroomId and subject are required.");
  }
  if (!isAssigned(req.user, classroomId, subject)) {
    throw new ApiError(403, "You aren't assigned to teach this subject for this class.");
  }

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw new ApiError(404, "Classroom not found.");

  const students = await User.find({ _id: { $in: classroom.students } })
    .select("firstName lastName rollNumber")
    .sort({ rollNumber: 1 })
    .lean();

  const targetDate = startOfDay(date ? new Date(date) : new Date());
  const records = await Attendance.find({
    student: { $in: students.map((s) => s._id) },
    subject,
    date: targetDate,
  }).lean();
  const statusByStudent = new Map(records.map((r) => [r.student.toString(), r.status]));

  return sendResponse(res, 200, "Roster fetched.", {
    students: students.map((s) => ({
      ...s,
      status: statusByStudent.get(s._id.toString()) || null,
    })),
  });
});

// ── POST /api/faculty/attendance ───────────────────────────────────
// Body: { classroomId, subject, date?, records: [{ studentId, status }] }
export const markRosterAttendance = asyncHandler(async (req, res) => {
  const { classroomId, subject, date, records } = req.body;

  if (!classroomId || !subject || !Array.isArray(records) || records.length === 0) {
    throw new ApiError(400, "classroomId, subject and records are required.");
  }
  if (!isAssigned(req.user, classroomId, subject)) {
    throw new ApiError(403, "You aren't assigned to teach this subject for this class.");
  }

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw new ApiError(404, "Classroom not found.");

  const targetDate = date ? new Date(date) : new Date();
  const dayName = dayNameFromDate(targetDate);
  const period = (classroom.timetable?.[dayName] || []).find((p) => p.subject === subject);

  const ops = records.map(({ studentId, status }) => ({
    updateOne: {
      filter: {
        student: studentId,
        subject,
        date: startOfDay(targetDate),
        startTime: period?.startTime || "00:00",
      },
      update: {
        $set: {
          student: studentId,
          classroom: classroomId,
          subject,
          faculty: `${req.user.firstName} ${req.user.lastName}`,
          date: startOfDay(targetDate),
          day: dayName,
          startTime: period?.startTime || "00:00",
          endTime: period?.endTime || "23:59",
          status,
          method: "manual",
          markedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(ops);

  return sendResponse(res, 200, `Attendance saved for ${records.length} students.`);
});

// ── GET /api/faculty/attendance/export ─────────────────────────────
// Query: classroomId, subject, from?, to? — downloads an .xlsx of every
// attendance record for that class+subject in the date range.
export const exportRosterAttendance = asyncHandler(async (req, res) => {
  const { classroomId, subject, from, to } = req.query;
  if (!classroomId || !subject) {
    throw new ApiError(400, "classroomId and subject are required.");
  }
  if (!isAssigned(req.user, classroomId, subject)) {
    throw new ApiError(403, "You aren't assigned to teach this subject for this class.");
  }

  const filter = { classroom: classroomId, subject };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = startOfDay(new Date(from));
    if (to) filter.date.$lte = startOfDay(new Date(to));
  }

  const records = await Attendance.find(filter)
    .populate("student", "firstName lastName rollNumber")
    .sort({ date: -1, startTime: -1 })
    .lean();

  const rows = records.map((r) => ({
    studentName: r.student ? `${r.student.firstName} ${r.student.lastName}` : "—",
    rollNumber: r.student?.rollNumber || "—",
    subject: r.subject,
    date: new Date(r.date).toLocaleDateString("en-IN"),
    status: r.status === "present" ? "Present" : "Absent",
    time: r.status === "present" ? new Date(r.markedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—",
    method: r.method === "face" ? "Face" : "Manual",
  }));

  await streamAttendanceExcel(res, `attendance-${subject}-${Date.now()}.xlsx`, rows);
});

// ══════════════════════════ Admin: manage faculty ══════════════════

// ── GET /api/faculty/admin/classrooms ──────────────────────────────
// Lightweight list for populating the assignment dropdown.
export const adminListClassrooms = asyncHandler(async (req, res) => {
  const classrooms = await Classroom.find()
    .select("className branch year section")
    .sort({ className: 1 })
    .lean();
  return sendResponse(res, 200, "Classrooms fetched.", { classrooms });
});

// ── GET /api/faculty/admin/list ────────────────────────────────────
export const adminListFaculty = asyncHandler(async (req, res) => {
  const faculty = await User.find({ role: "faculty" })
    .select("firstName lastName email facultyAssignments")
    .populate("facultyAssignments.classroom", "className")
    .sort({ firstName: 1 })
    .lean();

  return sendResponse(res, 200, "Faculty fetched.", { faculty });
});

// ── POST /api/faculty/admin/create ─────────────────────────────────
// Body: { firstName, lastName, email, password, classroomId, subject }
// Creates a faculty account (or, if the email already belongs to a
// faculty user, just adds the new classroom+subject assignment to it).
export const adminCreateOrAssignFaculty = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, classroomId, subject } = req.body;

  if (!classroomId || !subject) {
    throw new ApiError(400, "classroomId and subject are required.");
  }

  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw new ApiError(404, "Classroom not found.");

  let faculty = await User.findOne({ email });

  if (faculty) {
    if (faculty.role !== "faculty") {
      throw new ApiError(409, "This email belongs to a non-faculty account.");
    }
    if (isAssigned(faculty, classroomId, subject)) {
      throw new ApiError(409, "This faculty member is already assigned to that class+subject.");
    }
    faculty.facultyAssignments.push({ classroom: classroomId, subject });
    await faculty.save({ validateModifiedOnly: true });
    return sendResponse(res, 200, "Assignment added.", { faculty });
  }

  if (!firstName || !lastName || !password) {
    throw new ApiError(400, "firstName, lastName and password are required for a new faculty account.");
  }

  faculty = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: "faculty",
    branch: "Faculty",
    year: 1,
    section: "-",
    rollNumber: `FAC-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`,
    facultyAssignments: [{ classroom: classroomId, subject }],
  });

  return sendResponse(res, 201, "Faculty account created.", { faculty });
});

// ══════════════════════════ Student approval (by faculty) ══════════

// ── GET /api/faculty/pending-students ────────────────────────────────
// Students who requested THIS teacher specifically, and are still pending.
export const listPendingStudents = asyncHandler(async (req, res) => {
  const students = await User.find({
    role: "student",
    status: "pending",
    "pendingRequest.faculty": req.user._id,
  })
    .select("firstName lastName email branch year section rollNumber pendingRequest createdAt")
    .sort({ createdAt: 1 })
    .lean();

  return sendResponse(res, 200, "Pending students fetched.", { students });
});

// ── PATCH /api/faculty/pending-students/:studentId/approve ────────────
export const approveStudent = asyncHandler(async (req, res) => {
  const student = await User.findOne({
    _id: req.params.studentId,
    role: "student",
    status: "pending",
    "pendingRequest.faculty": req.user._id,
  });
  if (!student) throw new ApiError(404, "No matching pending student request found.");

  const subject = student.pendingRequest.subject;
  const assignment = (req.user.facultyAssignments || []).find((a) => a.subject === subject);
  if (!assignment) {
    throw new ApiError(
      409,
      `You aren't currently assigned to teach ${subject} in any classroom — ask an admin to assign you first.`
    );
  }

  student.status = "approved";
  student.classroom = assignment.classroom;
  student.pendingRequest = { faculty: null, subject: null };
  await student.save({ validateModifiedOnly: true });

  await Classroom.findByIdAndUpdate(assignment.classroom, {
    $addToSet: { students: student._id },
  });

  return sendResponse(res, 200, `${student.firstName} approved and added to ${subject}.`, { student });
});

// ── PATCH /api/faculty/pending-students/:studentId/reject ─────────────
export const rejectStudent = asyncHandler(async (req, res) => {
  const student = await User.findOneAndUpdate(
    {
      _id: req.params.studentId,
      role: "student",
      status: "pending",
      "pendingRequest.faculty": req.user._id,
    },
    { status: "rejected" },
    { new: true }
  );
  if (!student) throw new ApiError(404, "No matching pending student request found.");

  return sendResponse(res, 200, `${student.firstName}'s request was rejected.`, { student });
});

// ══════════════════════════ Teacher approval (by admin) ═════════════

// ── GET /api/faculty/admin/pending ───────────────────────────────────
export const adminListPendingFaculty = asyncHandler(async (req, res) => {
  const faculty = await User.find({ role: "faculty", status: "pending" })
    .select("firstName lastName email department employeeId requestedSubjects createdAt")
    .sort({ createdAt: 1 })
    .lean();

  return sendResponse(res, 200, "Pending teachers fetched.", { faculty });
});

// ── PATCH /api/faculty/admin/:id/approve ─────────────────────────────
export const adminApproveFaculty = asyncHandler(async (req, res) => {
  const faculty = await User.findOneAndUpdate(
    { _id: req.params.id, role: "faculty", status: "pending" },
    { status: "approved" },
    { new: true }
  );
  if (!faculty) throw new ApiError(404, "No matching pending teacher found.");

  return sendResponse(
    res,
    200,
    `${faculty.firstName} approved. Assign them to a classroom+subject below to finish setup.`,
    { faculty }
  );
});

// ── PATCH /api/faculty/admin/:id/reject ──────────────────────────────
export const adminRejectFaculty = asyncHandler(async (req, res) => {
  const faculty = await User.findOneAndUpdate(
    { _id: req.params.id, role: "faculty", status: "pending" },
    { status: "rejected" },
    { new: true }
  );
  if (!faculty) throw new ApiError(404, "No matching pending teacher found.");

  return sendResponse(res, 200, `${faculty.firstName}'s request was rejected.`, { faculty });
});
