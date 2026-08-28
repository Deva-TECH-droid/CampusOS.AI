import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  enrollFace,
  getFaceEnrollmentStatus,
  resetFaceEnrollment,
  getActivePeriod,
  markAttendance,
  getMyAttendance,
  getMyStats,
  kioskRecognize,
  adminListStudents,
  adminEnrollFace,
  adminStats,
  adminLogs,
  adminMarkManual,
  adminExportLogs,
} from "../controllers/attendance.controller.js";

const attendanceRouter = express.Router();

// ── Student self check-in ──
attendanceRouter.post("/enroll-face", authMiddleware, enrollFace);
attendanceRouter.get("/enroll-face/status", authMiddleware, getFaceEnrollmentStatus);
attendanceRouter.delete("/enroll-face", authMiddleware, resetFaceEnrollment);

attendanceRouter.get("/active-period", authMiddleware, getActivePeriod);
attendanceRouter.post("/mark", authMiddleware, markAttendance);

attendanceRouter.get("/my", authMiddleware, getMyAttendance);
attendanceRouter.get("/my/stats", authMiddleware, getMyStats);

// ── Kiosk mode: shared device, 1:N recognition ──
attendanceRouter.post("/kiosk/recognize", authMiddleware, kioskRecognize);

// ── Admin ──
attendanceRouter.get(
  "/admin/students",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminListStudents
);
attendanceRouter.post(
  "/admin/enroll-face/:studentId",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminEnrollFace
);
attendanceRouter.get(
  "/admin/stats",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminStats
);
attendanceRouter.get(
  "/admin/logs",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminLogs
);
attendanceRouter.post(
  "/admin/mark-manual",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminMarkManual
);
attendanceRouter.get(
  "/admin/export",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminExportLogs
);

export default attendanceRouter;
