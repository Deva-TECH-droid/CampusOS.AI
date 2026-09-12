import mongoose from "mongoose";
import User from "../models/User.js";
import Classroom from "../models/Classroom.js";
import Attendance from "../models/Attendance.js";
import FacultyAttendance from "../models/FacultyAttendance.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import ApiError from "../utils/apiError.js";
import {
  startOfDay,
  dayNameFromDate,
  euclideanDistance,
  FACE_MATCH_THRESHOLD,
} from "../services/attendance.service.js";
import { streamAttendanceExcel, buildStudentListWorkbook } from "../utils/excel.js";
import { sendEmailWithAttachment } from "../services/email.service.js";

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

// ── GET /api/faculty/timetable ────────────────────────────────────
// Aggregates periods taught by this faculty across all classrooms
export const getMyTimetable = asyncHandler(async (req, res) => {
  const user = req.user;
  const facultyFullName = `${user.firstName} ${user.lastName}`.toLowerCase();
  const classrooms = await Classroom.find().lean();

  const now = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = days[now.getDay()];

  const weeklySchedule = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  };

  classrooms.forEach((cls) => {
    if (!cls.timetable) return;
    Object.keys(weeklySchedule).forEach((day) => {
      const periods = cls.timetable[day] || [];
      periods.forEach((p) => {
        const periodFac = (p.faculty || "").toLowerCase();
        // Match if period has faculty name or faculty assignments match
        const matchAssignment = (user.facultyAssignments || []).some(
          (a) => a.classroom.toString() === cls._id.toString() && a.subject === p.subject
        );
        if (periodFac.includes(user.firstName.toLowerCase()) || matchAssignment) {
          weeklySchedule[day].push({
            subject: p.subject,
            className: cls.className,
            classroomId: cls._id,
            room: p.room || "Classroom",
            startTime: p.startTime,
            endTime: p.endTime,
          });
        }
      });
    });
  });

  // Sort each day by start time
  Object.keys(weeklySchedule).forEach((day) => {
    weeklySchedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  const todaySchedule = weeklySchedule[todayName] || [];

  return sendResponse(res, 200, "Timetable fetched.", {
    today: todayName,
    todaySchedule,
    weeklySchedule,
  });
});

// ── GET /api/faculty/roster ────────────────────────────────────────
// Query: classroomId, subject, date? — the class list + today's status,
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
    .select("firstName lastName rollNumber email branch department")
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

// ── Helper: generate student list rows for Excel export / email ──
const getStudentListRows = async (classroomId, subject, facultyUser) => {
  const classroom = await Classroom.findById(classroomId).lean();
  if (!classroom) throw new ApiError(404, "Classroom not found.");

  const students = await User.find({ _id: { $in: classroom.students } })
    .select("firstName lastName rollNumber email branch department")
    .sort({ rollNumber: 1 })
    .lean();

  // Get attendance stats for each student in this subject
  const attendanceCounts = await Attendance.aggregate([
    { $match: { classroom: new mongoose.Types.ObjectId(classroomId), subject } },
    { $group: { _id: { student: "$student", status: "$status" }, count: { $sum: 1 } } },
  ]);

  const statsMap = {};
  attendanceCounts.forEach((ac) => {
    const sId = ac._id.student.toString();
    if (!statsMap[sId]) statsMap[sId] = { present: 0, total: 0 };
    statsMap[sId].total += ac.count;
    if (ac._id.status === "present") statsMap[sId].present += ac.count;
  });

  const teacherName = `${facultyUser.firstName} ${facultyUser.lastName}`;

  const rows = students.map((s) => {
    const sId = s._id.toString();
    const st = statsMap[sId] || { present: 0, total: 0 };
    const pct = st.total > 0 ? `${Math.round((st.present / st.total) * 100)}%` : "N/A";
    const attendanceSummary = st.total > 0 ? `${st.present}/${st.total} (${pct})` : "Present";

    return {
      studentName: `${s.firstName} ${s.lastName}`,
      rollNumber: s.rollNumber || "—",
      email: s.email || "—",
      department: s.department || s.branch || "Engineering",
      className: classroom.className,
      subject,
      teacher: teacherName,
      attendance: attendanceSummary,
    };
  });

  return { classroom, students, rows, teacherName };
};

// ── GET /api/faculty/student-list/export ───────────────────────────
// Requirement 12: Download Student List as Excel
export const exportStudentListExcel = asyncHandler(async (req, res) => {
  const { classroomId, subject } = req.query;
  if (!classroomId || !subject) {
    throw new ApiError(400, "classroomId and subject are required.");
  }

  const { classroom, rows } = await getStudentListRows(classroomId, subject, req.user);
  const cleanClassName = classroom.className.replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanSubject = subject.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${cleanSubject}_${cleanClassName}_Students.xlsx`;

  const workbook = buildStudentListWorkbook(rows);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

// ── POST /api/faculty/student-list/send-to-admin ───────────────────
// Requirement 13: Send Downloaded Excel File to Admin by Email
export const sendStudentListToAdmin = asyncHandler(async (req, res) => {
  const { classroomId, subject } = req.body;
  if (!classroomId || !subject) {
    throw new ApiError(400, "classroomId and subject are required.");
  }

  const { classroom, rows, teacherName } = await getStudentListRows(classroomId, subject, req.user);
  const workbook = buildStudentListWorkbook(rows);
  const buffer = await workbook.xlsx.writeBuffer();

  const cleanClassName = classroom.className.replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanSubject = subject.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${cleanSubject}_${cleanClassName}_Students.xlsx`;
  const emailSubject = `Student List — ${subject} — ${classroom.className}`;

  const emailText = `Hello Admin,\n\nPlease find attached the updated student list and attendance summary for ${subject} (${classroom.className}), prepared by ${teacherName}.\n\nTotal Enrolled Students: ${rows.length}\nGenerated on: ${new Date().toLocaleString("en-IN")}\n\nRegards,\n${teacherName}\nCampusOS Faculty Portal`;

  const result = await sendEmailWithAttachment({
    to: process.env.ADMIN_EMAIL,
    subject: emailSubject,
    text: emailText,
    filename,
    content: buffer,
  });

  return sendResponse(res, 200, "Student list has been successfully sent to the admin.", {
    filename,
    recipient: result.recipient,
  });
});

// ══════════════════════════ Teacher Face Attendance (Req 9) ════════
// ── POST /api/faculty/attendance/mark-face ─────────────────────────
export const markTeacherFaceAttendance = asyncHandler(async (req, res) => {
  const { descriptor } = req.body;
  const user = await User.findById(req.user._id).select("+faceDescriptor");

  if (!user.faceEnrolled || !user.faceDescriptor?.length) {
    throw new ApiError(400, "Face not enrolled yet. Please enroll your face in the attendance section first.");
  }

  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    throw new ApiError(400, "Invalid face descriptor captured.");
  }

  const distance = euclideanDistance(user.faceDescriptor, descriptor);
  if (distance > FACE_MATCH_THRESHOLD) {
    throw new ApiError(401, "Face didn't match your enrolled teacher profile. Please try again with clear lighting.");
  }

  const now = new Date();
  const today = startOfDay(now);
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const existing = await FacultyAttendance.findOne({ faculty: user._id, date: today });
  if (existing) {
    return sendResponse(res, 200, `Attendance already recorded for today at ${existing.time}.`, {
      record: existing,
      alreadyMarked: true,
    });
  }

  const record = await FacultyAttendance.create({
    faculty: user._id,
    facultyName: `${user.firstName} ${user.lastName}`,
    department: user.department || "Faculty",
    date: today,
    time: timeStr,
    status: "Present",
    method: "face",
    matchConfidence: distance,
    markedAt: now,
  });

  return sendResponse(res, 201, `Teacher attendance marked as Present at ${timeStr}.`, {
    record,
    alreadyMarked: false,
  });
});

// ── GET /api/faculty/attendance/today-status ──────────────────────
export const getTeacherTodayStatus = asyncHandler(async (req, res) => {
  const today = startOfDay(new Date());
  const record = await FacultyAttendance.findOne({ faculty: req.user._id, date: today }).lean();

  return sendResponse(res, 200, "Today's status fetched.", {
    marked: !!record,
    record: record || null,
  });
});

// ── GET /api/faculty/admin/faculty-attendance ─────────────────────
// Admin views faculty attendance records table
export const adminListFacultyAttendance = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const filter = {};
  if (date) {
    filter.date = startOfDay(new Date(date));
  }

  const records = await FacultyAttendance.find(filter)
    .populate("faculty", "firstName lastName email department employeeId")
    .sort({ markedAt: -1 })
    .lean();

  return sendResponse(res, 200, "Faculty attendance records fetched.", { records });
});

// ══════════════════════════ Admin: manage faculty ══════════════════

// ── GET /api/faculty/admin/classrooms ──────────────────────────────
export const adminListClassrooms = asyncHandler(async (req, res) => {
  const classrooms = await Classroom.find()
    .select("className branch year section timetable")
    .sort({ className: 1 })
    .lean();
  return sendResponse(res, 200, "Classrooms fetched.", { classrooms });
});

// ── GET /api/faculty/admin/list ────────────────────────────────────
export const adminListFaculty = asyncHandler(async (req, res) => {
  const faculty = await User.find({ role: "faculty" })
    .select("firstName lastName email department employeeId facultyAssignments status")
    .populate("facultyAssignments.classroom", "className branch section")
    .sort({ firstName: 1 })
    .lean();

  return sendResponse(res, 200, "Faculty fetched.", { faculty });
});

// ── POST /api/faculty/admin/create ─────────────────────────────────
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
export const listPendingStudents = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;

  // Find students where either legacy pendingRequest.faculty matches, or studentRequests matches
  const students = await User.find({
    role: "student",
    $or: [
      { "pendingRequest.faculty": facultyId, status: "pending" },
      {
        studentRequests: {
          $elemMatch: { faculty: facultyId, status: "pending" },
        },
      },
    ],
  })
    .select("firstName lastName email branch year section rollNumber pendingRequest studentRequests createdAt")
    .sort({ createdAt: 1 })
    .lean();

  return sendResponse(res, 200, "Pending students fetched.", { students });
});

// ── GET /api/faculty/approved-students ───────────────────────────────
export const listApprovedStudents = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;
  const classroomIds = (req.user.facultyAssignments || []).map((a) => a.classroom).filter(Boolean);

  const students = await User.find({
    role: "student",
    $or: [
      { classroom: { $in: classroomIds } },
      { "studentRequests.faculty": facultyId, "studentRequests.status": "approved" },
    ],
  })
    .select("firstName lastName email branch year section rollNumber classroom createdAt")
    .populate("classroom", "className")
    .sort({ firstName: 1 })
    .lean();

  return sendResponse(res, 200, "Approved students fetched.", { students });
});

// ── GET /api/faculty/rejected-students ───────────────────────────────
export const listRejectedStudents = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;

  const students = await User.find({
    role: "student",
    $or: [
      { status: "rejected", "pendingRequest.faculty": facultyId },
      { "studentRequests.faculty": facultyId, "studentRequests.status": "rejected" },
    ],
  })
    .select("firstName lastName email branch year section rollNumber studentRequests pendingRequest updatedAt")
    .sort({ updatedAt: -1 })
    .lean();

  return sendResponse(res, 200, "Rejected requests fetched.", { students });
});

// ── GET /api/faculty/enrolled-students ───────────────────────────────
// Students grouped by subject/classroom with attendance summary
export const listEnrolledStudents = asyncHandler(async (req, res) => {
  const assignments = req.user.facultyAssignments || [];
  const results = [];

  for (const assign of assignments) {
    const classroom = await Classroom.findById(assign.classroom).lean();
    if (!classroom) continue;

    const students = await User.find({ _id: { $in: classroom.students } })
      .select("firstName lastName rollNumber email branch department")
      .sort({ rollNumber: 1 })
      .lean();

    results.push({
      subject: assign.subject,
      classroomId: classroom._id,
      className: classroom.className,
      students,
      studentCount: students.length,
    });
  }

  return sendResponse(res, 200, "Enrolled students fetched.", { enrollments: results });
});

// ── PATCH /api/faculty/pending-students/:studentId/approve ────────────
export const approveStudent = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.studentId);
  if (!student) throw new ApiError(404, "Student record not found.");

  let subject = student.pendingRequest?.subject;
  let targetClassroom = null;

  // Check in studentRequests array
  const reqItem = (student.studentRequests || []).find(
    (r) => r.faculty?.toString() === req.user._id.toString() && r.status === "pending"
  );

  if (reqItem) {
    reqItem.status = "approved";
    subject = reqItem.subject || subject;
    targetClassroom = reqItem.classroom;
  }

  const assignment = (req.user.facultyAssignments || []).find((a) => a.subject === subject);
  if (!assignment && !targetClassroom) {
    throw new ApiError(
      409,
      `You aren't currently assigned to teach ${subject || "this subject"} in any classroom — ask an admin to assign you first.`
    );
  }

  const classToAssign = targetClassroom || assignment.classroom;

  student.status = "approved";
  student.classroom = classToAssign;
  student.pendingRequest = { faculty: null, subject: null };
  await student.save({ validateModifiedOnly: true });

  await Classroom.findByIdAndUpdate(classToAssign, {
    $addToSet: { students: student._id },
  });

  return sendResponse(res, 200, `${student.firstName} approved and added to ${subject || "class"}.`, { student });
});

// ── PATCH /api/faculty/pending-students/:studentId/reject ─────────────
export const rejectStudent = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.studentId);
  if (!student) throw new ApiError(404, "Student record not found.");

  if (student.pendingRequest?.faculty?.toString() === req.user._id.toString()) {
    student.status = "rejected";
  }

  (student.studentRequests || []).forEach((r) => {
    if (r.faculty?.toString() === req.user._id.toString()) {
      r.status = "rejected";
    }
  });

  await student.save({ validateModifiedOnly: true });
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
