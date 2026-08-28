import User from "../models/User.js";
import Classroom from "../models/Classroom.js";
import Attendance from "../models/Attendance.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import ApiError from "../utils/apiError.js";
import {
  findActivePeriod,
  startOfDay,
  euclideanDistance,
  dayNameFromDate,
  findBestFaceMatch,
  FACE_MATCH_THRESHOLD,
} from "../services/attendance.service.js";
import { streamAttendanceExcel } from "../utils/excel.js";

const DESCRIPTOR_LENGTH = 128; // face-api.js face recognition net output

const isValidDescriptor = (d) =>
  Array.isArray(d) &&
  d.length === DESCRIPTOR_LENGTH &&
  d.every((n) => typeof n === "number" && Number.isFinite(n));

// ── POST /api/attendance/enroll-face ─────────────────────────────
// Body: { descriptors: number[][] }  — a few samples captured client-side,
// we average them into a single reference descriptor for robustness.
export const enrollFace = asyncHandler(async (req, res) => {
  const { descriptors } = req.body;

  if (!Array.isArray(descriptors) || descriptors.length === 0) {
    throw new ApiError(400, "At least one face sample is required.");
  }
  if (!descriptors.every(isValidDescriptor)) {
    throw new ApiError(400, "Invalid face descriptor data.");
  }

  const averaged = new Array(DESCRIPTOR_LENGTH).fill(0);
  descriptors.forEach((desc) => {
    desc.forEach((val, i) => {
      averaged[i] += val / descriptors.length;
    });
  });

  await User.findByIdAndUpdate(req.user._id, {
    faceDescriptor: averaged,
    faceEnrolled: true,
    faceEnrolledAt: new Date(),
  });

  return sendResponse(res, 200, "Face enrolled successfully.", {
    faceEnrolled: true,
  });
});

// ── GET /api/attendance/enroll-face/status ───────────────────────
export const getFaceEnrollmentStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "faceEnrolled faceEnrolledAt"
  );
  return sendResponse(res, 200, "Face enrollment status fetched.", {
    faceEnrolled: user.faceEnrolled,
    faceEnrolledAt: user.faceEnrolledAt,
  });
});

// ── DELETE /api/attendance/enroll-face ────────────────────────────
// Lets a student re-enroll (e.g. after a haircut(!), lighting issues, etc.)
export const resetFaceEnrollment = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { faceDescriptor: "" },
    faceEnrolled: false,
    faceEnrolledAt: null,
  });
  return sendResponse(res, 200, "Face enrollment reset.", {
    faceEnrolled: false,
  });
});

// ── GET /api/attendance/active-period ─────────────────────────────
// Tells the frontend what period (if any) is live right now for the
// student's classroom, and whether it's already been marked.
export const getActivePeriod = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user.classroom) {
    return sendResponse(res, 200, "No classroom assigned.", {
      period: null,
    });
  }

  const classroom = await Classroom.findById(user.classroom).lean();
  if (!classroom) {
    return sendResponse(res, 200, "Classroom not found.", { period: null });
  }

  const now = new Date();
  const period = findActivePeriod(classroom, now);

  if (!period) {
    return sendResponse(res, 200, "No period active right now.", {
      period: null,
    });
  }

  const existing = await Attendance.findOne({
    student: user._id,
    subject: period.subject,
    date: startOfDay(now),
    startTime: period.startTime,
  }).lean();

  return sendResponse(res, 200, "Active period fetched.", {
    period,
    day: dayNameFromDate(now),
    alreadyMarked: !!existing,
    markedAt: existing?.markedAt || null,
  });
});

// ── POST /api/attendance/mark ─────────────────────────────────────
// Body: { descriptor: number[] } — a single live capture, matched against
// the student's own enrolled descriptor (never against the whole class —
// this is self check-in, so we only need to confirm "is this really you").
export const markAttendance = asyncHandler(async (req, res) => {
  const { descriptor } = req.body;

  if (!isValidDescriptor(descriptor)) {
    throw new ApiError(400, "Invalid face descriptor.");
  }

  const user = await User.findById(req.user._id).select("+faceDescriptor");
  if (!user.faceEnrolled || !user.faceDescriptor?.length) {
    throw new ApiError(
      400,
      "Face not enrolled yet. Please enroll your face first."
    );
  }
  if (!user.classroom) {
    throw new ApiError(400, "You are not assigned to a classroom.");
  }

  const classroom = await Classroom.findById(user.classroom).lean();
  if (!classroom) {
    throw new ApiError(404, "Classroom not found.");
  }

  const now = new Date();
  const period = findActivePeriod(classroom, now);
  if (!period) {
    throw new ApiError(
      409,
      "No class period is active right now. Attendance can only be marked during a scheduled period."
    );
  }

  const distance = euclideanDistance(user.faceDescriptor, descriptor);
  if (distance > FACE_MATCH_THRESHOLD) {
    throw new ApiError(
      401,
      "Face didn't match your enrolled profile. Please try again with clear, even lighting."
    );
  }

  try {
    const record = await Attendance.create({
      student: user._id,
      classroom: classroom._id,
      subject: period.subject,
      faculty: period.faculty,
      date: startOfDay(now),
      day: dayNameFromDate(now),
      startTime: period.startTime,
      endTime: period.endTime,
      status: "present",
      method: "face",
      matchConfidence: distance,
    });

    return sendResponse(res, 201, "Attendance marked as present.", {
      record,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(
        409,
        "Attendance for this period has already been marked."
      );
    }
    throw err;
  }
});

// ── GET /api/attendance/my ────────────────────────────────────────
// Query: ?subject=&from=&to=
export const getMyAttendance = asyncHandler(async (req, res) => {
  const { subject, from, to } = req.query;

  const filter = { student: req.user._id };
  if (subject) filter.subject = subject;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = startOfDay(new Date(from));
    if (to) filter.date.$lte = startOfDay(new Date(to));
  }

  const records = await Attendance.find(filter).sort({ date: -1, startTime: -1 }).lean();

  return sendResponse(res, 200, "Attendance records fetched.", { records });
});

// ── GET /api/attendance/my/stats ──────────────────────────────────
// Per-subject and overall attendance percentage, computed against the
// number of periods that have actually occurred so far (from the
// classroom's own timetable), not just the days a record exists for.
export const getMyStats = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user.classroom) {
    return sendResponse(res, 200, "No classroom assigned.", {
      overall: null,
      subjects: [],
    });
  }

  const classroom = await Classroom.findById(user.classroom).lean();
  const records = await Attendance.find({ student: user._id }).lean();

  const presentBySubject = {};
  records.forEach((r) => {
    presentBySubject[r.subject] = (presentBySubject[r.subject] || 0) + 1;
  });

  // Count how many times each subject has occurred, from the classroom's
  // creation date up through today, based on the weekly timetable.
  const occurrencesBySubject = {};
  if (classroom?.timetable) {
    const start = new Date(classroom.createdAt);
    const end = new Date();
    const cursor = new Date(start);
    while (cursor <= end) {
      const day = dayNameFromDate(cursor);
      const periods = classroom.timetable[day] || [];
      periods.forEach((p) => {
        occurrencesBySubject[p.subject] =
          (occurrencesBySubject[p.subject] || 0) + 1;
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const subjects = Object.keys(occurrencesBySubject).map((subject) => {
    const total = occurrencesBySubject[subject];
    const present = presentBySubject[subject] || 0;
    return {
      subject,
      present,
      total,
      percentage: total > 0 ? Math.round((present / total) * 1000) / 10 : 0,
    };
  });

  const totalOccurrences = subjects.reduce((sum, s) => sum + s.total, 0);
  const totalPresent = subjects.reduce((sum, s) => sum + s.present, 0);

  return sendResponse(res, 200, "Attendance stats fetched.", {
    overall: {
      present: totalPresent,
      total: totalOccurrences,
      percentage:
        totalOccurrences > 0
          ? Math.round((totalPresent / totalOccurrences) * 1000) / 10
          : 0,
    },
    subjects: subjects.sort((a, b) => a.subject.localeCompare(b.subject)),
  });
});

// ── POST /api/attendance/kiosk/recognize ──────────────────────────
// Walk-up mode: a shared device (logged in as a class rep / faculty /
// admin) stays open in the classroom. Any student steps up, and their
// live descriptor is matched 1:N against everyone enrolled in the
// operator's classroom. On a match, attendance is marked for THAT
// student for the currently active period — not the operator.
export const kioskRecognize = asyncHandler(async (req, res) => {
  const { descriptor } = req.body;

  if (!isValidDescriptor(descriptor)) {
    throw new ApiError(400, "Invalid face descriptor.");
  }
  if (!req.user.classroom) {
    throw new ApiError(400, "This account isn't assigned to a classroom.");
  }

  const classroom = await Classroom.findById(req.user.classroom).lean();
  if (!classroom) {
    throw new ApiError(404, "Classroom not found.");
  }

  const now = new Date();
  const period = findActivePeriod(classroom, now);
  if (!period) {
    throw new ApiError(
      409,
      "No class period is active right now. Kiosk check-in only works during a scheduled period."
    );
  }

  const roster = await User.find({
    _id: { $in: classroom.students },
    faceEnrolled: true,
  })
    .select("firstName lastName rollNumber faceDescriptor")
    .select("+faceDescriptor")
    .lean();

  const match = findBestFaceMatch(descriptor, roster);
  if (!match) {
    throw new ApiError(
      401,
      "Face not recognized. Make sure you're enrolled and try again with clear lighting."
    );
  }

  const student = match.student;

  const existing = await Attendance.findOne({
    student: student._id,
    subject: period.subject,
    date: startOfDay(now),
    startTime: period.startTime,
  }).lean();

  if (existing) {
    return sendResponse(res, 200, "Already marked present.", {
      alreadyMarked: true,
      student: {
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
      },
      subject: period.subject,
    });
  }

  const record = await Attendance.create({
    student: student._id,
    classroom: classroom._id,
    subject: period.subject,
    faculty: period.faculty,
    date: startOfDay(now),
    day: dayNameFromDate(now),
    startTime: period.startTime,
    endTime: period.endTime,
    status: "present",
    method: "face",
    matchConfidence: match.distance,
  });

  return sendResponse(res, 201, "Attendance marked as present.", {
    alreadyMarked: false,
    student: {
      name: `${student.firstName} ${student.lastName}`,
      rollNumber: student.rollNumber,
    },
    subject: period.subject,
    record,
  });
});

// ══════════════════════════ Admin ══════════════════════════════
// Everything below is gated to superadmin via roleMiddleware on the route.

// ── GET /api/attendance/admin/students ────────────────────────────
// Roster with face-enrollment + today's status, for the admin panel.
// Optional ?classroomId= to scope to one classroom.
export const adminListStudents = asyncHandler(async (req, res) => {
  const { classroomId } = req.query;
  const filter = { role: "student" };
  if (classroomId) filter.classroom = classroomId;

  const students = await User.find(filter)
    .select("firstName lastName rollNumber branch year section classroom faceEnrolled")
    .populate("classroom", "className")
    .sort({ rollNumber: 1 })
    .lean();

  const today = startOfDay();
  const todaysRecords = await Attendance.find({
    student: { $in: students.map((s) => s._id) },
    date: today,
  })
    .select("student")
    .lean();
  const presentIds = new Set(todaysRecords.map((r) => r.student.toString()));

  return sendResponse(res, 200, "Students fetched.", {
    students: students.map((s) => ({
      ...s,
      presentToday: presentIds.has(s._id.toString()),
    })),
  });
});

// ── POST /api/attendance/admin/enroll-face/:studentId ──────────────
// Admin captures face samples on behalf of a student (e.g. a device-less
// student, or bulk onboarding day).
export const adminEnrollFace = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { descriptors } = req.body;

  if (!Array.isArray(descriptors) || descriptors.length === 0) {
    throw new ApiError(400, "At least one face sample is required.");
  }
  if (!descriptors.every(isValidDescriptor)) {
    throw new ApiError(400, "Invalid face descriptor data.");
  }

  const student = await User.findOne({ _id: studentId, role: "student" });
  if (!student) throw new ApiError(404, "Student not found.");

  const averaged = new Array(DESCRIPTOR_LENGTH).fill(0);
  descriptors.forEach((desc) => {
    desc.forEach((val, i) => {
      averaged[i] += val / descriptors.length;
    });
  });

  student.faceDescriptor = averaged;
  student.faceEnrolled = true;
  student.faceEnrolledAt = new Date();
  await student.save({ validateModifiedOnly: true });

  return sendResponse(res, 200, `Face enrolled for ${student.firstName}.`, {
    faceEnrolled: true,
  });
});

// ── GET /api/attendance/admin/stats ────────────────────────────────
export const adminStats = asyncHandler(async (req, res) => {
  const { classroomId } = req.query;
  const studentFilter = { role: "student" };
  if (classroomId) studentFilter.classroom = classroomId;

  const students = await User.find(studentFilter).select("_id").lean();
  const studentIds = students.map((s) => s._id);
  const totalStudents = studentIds.length;

  const today = startOfDay();
  const todaysRecords = await Attendance.find({
    student: { $in: studentIds },
    date: today,
  }).lean();

  const presentToday = new Set(todaysRecords.map((r) => r.student.toString())).size;

  const bySubject = {};
  todaysRecords.forEach((r) => {
    bySubject[r.subject] = (bySubject[r.subject] || 0) + 1;
  });

  return sendResponse(res, 200, "Stats fetched.", {
    totalStudents,
    presentToday,
    absentToday: Math.max(totalStudents - presentToday, 0),
    periodsToday: Object.entries(bySubject).map(([subject, count]) => ({
      subject,
      count,
    })),
  });
});

// ── GET /api/attendance/admin/logs ─────────────────────────────────
// Query: ?classroomId=&subject=&date=YYYY-MM-DD
export const adminLogs = asyncHandler(async (req, res) => {
  const { classroomId, subject, date } = req.query;

  const filter = {};
  if (subject) filter.subject = subject;
  if (date) filter.date = startOfDay(new Date(date));
  if (classroomId) filter.classroom = classroomId;

  const logs = await Attendance.find(filter)
    .populate("student", "firstName lastName rollNumber")
    .sort({ date: -1, markedAt: -1 })
    .limit(200)
    .lean();

  return sendResponse(res, 200, "Logs fetched.", { logs });
});

// ── POST /api/attendance/admin/mark-manual ─────────────────────────
// Body: { studentId, subject, status, date? }
// For the rare case a student couldn't check in via face (camera issue,
// medical exemption, etc.) — an explicit admin override, always method:'manual'.
export const adminMarkManual = asyncHandler(async (req, res) => {
  const { studentId, subject, status = "present", date } = req.body;

  if (!studentId || !subject) {
    throw new ApiError(400, "studentId and subject are required.");
  }

  const student = await User.findOne({ _id: studentId, role: "student" });
  if (!student) throw new ApiError(404, "Student not found.");
  if (!student.classroom) throw new ApiError(400, "Student has no classroom assigned.");

  const classroom = await Classroom.findById(student.classroom).lean();
  const targetDate = date ? new Date(date) : new Date();
  const dayName = dayNameFromDate(targetDate);
  const period = (classroom?.timetable?.[dayName] || []).find(
    (p) => p.subject === subject
  );

  const record = await Attendance.findOneAndUpdate(
    {
      student: student._id,
      subject,
      date: startOfDay(targetDate),
      startTime: period?.startTime || "00:00",
    },
    {
      student: student._id,
      classroom: student.classroom,
      subject,
      faculty: period?.faculty || "",
      date: startOfDay(targetDate),
      day: dayName,
      startTime: period?.startTime || "00:00",
      endTime: period?.endTime || "23:59",
      status,
      method: "manual",
      markedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return sendResponse(res, 200, "Attendance updated.", { record });
});

// ── GET /api/attendance/admin/export ───────────────────────────────
// Query: ?classroomId=&subject=&date=YYYY-MM-DD — downloads a full .xlsx
// of matching attendance records across the whole college.
export const adminExportLogs = asyncHandler(async (req, res) => {
  const { classroomId, subject, date } = req.query;

  const filter = {};
  if (subject) filter.subject = subject;
  if (date) filter.date = startOfDay(new Date(date));
  if (classroomId) filter.classroom = classroomId;

  const logs = await Attendance.find(filter)
    .populate("student", "firstName lastName rollNumber")
    .sort({ date: -1, markedAt: -1 })
    .lean();

  const rows = logs.map((r) => ({
    studentName: r.student ? `${r.student.firstName} ${r.student.lastName}` : "—",
    rollNumber: r.student?.rollNumber || "—",
    subject: r.subject,
    date: new Date(r.date).toLocaleDateString("en-IN"),
    status: r.status === "present" ? "Present" : "Absent",
    time: r.status === "present" ? new Date(r.markedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—",
    method: r.method === "face" ? "Face" : "Manual",
  }));

  await streamAttendanceExcel(res, `attendance-report-${Date.now()}.xlsx`, rows);
});
