import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  myAssignments,
  getMyTimetable,
  getRoster,
  markRosterAttendance,
  exportRosterAttendance,
  exportStudentListExcel,
  sendStudentListToAdmin,
  markTeacherFaceAttendance,
  getTeacherTodayStatus,
  adminListFacultyAttendance,
  listPendingStudents,
  listApprovedStudents,
  listRejectedStudents,
  listEnrolledStudents,
  approveStudent,
  rejectStudent,
  adminListFaculty,
  adminCreateOrAssignFaculty,
  adminListClassrooms,
  adminListPendingFaculty,
  adminApproveFaculty,
  adminRejectFaculty,
} from "../controllers/faculty.controller.js";

const facultyRouter = express.Router();

facultyRouter.get("/assignments", authMiddleware, roleMiddleware("faculty"), myAssignments);
facultyRouter.get("/timetable", authMiddleware, roleMiddleware("faculty"), getMyTimetable);
facultyRouter.get("/roster", authMiddleware, roleMiddleware("faculty"), getRoster);
facultyRouter.post("/attendance", authMiddleware, roleMiddleware("faculty"), markRosterAttendance);
facultyRouter.get(
  "/attendance/export",
  authMiddleware,
  roleMiddleware("faculty"),
  exportRosterAttendance
);

// ── Teacher Face Attendance (Req 9) ──
facultyRouter.post(
  "/attendance/mark-face",
  authMiddleware,
  roleMiddleware("faculty"),
  markTeacherFaceAttendance
);
facultyRouter.get(
  "/attendance/today-status",
  authMiddleware,
  roleMiddleware("faculty"),
  getTeacherTodayStatus
);

// ── Excel Export & Email to Admin (Req 12 & 13) ──
facultyRouter.get(
  "/student-list/export",
  authMiddleware,
  roleMiddleware("faculty", "superadmin"),
  exportStudentListExcel
);
facultyRouter.post(
  "/student-list/send-to-admin",
  authMiddleware,
  roleMiddleware("faculty", "superadmin"),
  sendStudentListToAdmin
);

// ── Student approval & lists (by faculty - Req 7) ──
facultyRouter.get(
  "/pending-students",
  authMiddleware,
  roleMiddleware("faculty"),
  listPendingStudents
);
facultyRouter.get(
  "/approved-students",
  authMiddleware,
  roleMiddleware("faculty"),
  listApprovedStudents
);
facultyRouter.get(
  "/rejected-students",
  authMiddleware,
  roleMiddleware("faculty"),
  listRejectedStudents
);
facultyRouter.get(
  "/enrolled-students",
  authMiddleware,
  roleMiddleware("faculty"),
  listEnrolledStudents
);
facultyRouter.patch(
  "/pending-students/:studentId/approve",
  authMiddleware,
  roleMiddleware("faculty"),
  approveStudent
);
facultyRouter.patch(
  "/pending-students/:studentId/reject",
  authMiddleware,
  roleMiddleware("faculty"),
  rejectStudent
);

// ── Admin: manage faculty ──
facultyRouter.get("/admin/list", authMiddleware, roleMiddleware("superadmin"), adminListFaculty);
facultyRouter.get(
  "/admin/classrooms",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminListClassrooms
);
facultyRouter.post(
  "/admin/create",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminCreateOrAssignFaculty
);
facultyRouter.get(
  "/admin/pending",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminListPendingFaculty
);
facultyRouter.patch(
  "/admin/:id/approve",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminApproveFaculty
);
facultyRouter.patch(
  "/admin/:id/reject",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminRejectFaculty
);
facultyRouter.get(
  "/admin/faculty-attendance",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminListFacultyAttendance
);

export default facultyRouter;
