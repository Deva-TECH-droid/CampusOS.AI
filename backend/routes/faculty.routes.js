import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  myAssignments,
  getRoster,
  markRosterAttendance,
  exportRosterAttendance,
  listPendingStudents,
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
facultyRouter.get("/roster", authMiddleware, roleMiddleware("faculty"), getRoster);
facultyRouter.post("/attendance", authMiddleware, roleMiddleware("faculty"), markRosterAttendance);
facultyRouter.get(
  "/attendance/export",
  authMiddleware,
  roleMiddleware("faculty"),
  exportRosterAttendance
);

// ── Student approval (by faculty) ──
facultyRouter.get(
  "/pending-students",
  authMiddleware,
  roleMiddleware("faculty"),
  listPendingStudents
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

export default facultyRouter;
