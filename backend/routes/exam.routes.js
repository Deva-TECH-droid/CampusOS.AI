import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  createExam,
  updateExam,
  submitForApproval,
  listFacultyExams,
  getExamSubmissions,
  gradeSubmission,
  publishResults,
  getClassAnalytics,
  adminListPendingExams,
  adminApproveExam,
  adminRejectExam,
  listMyExams,
  startExam,
  submitExam,
  getMyAnalysis,
} from "../controllers/exam.controller.js";

const examRouter = express.Router();

// ── Faculty ──
examRouter.post("/", authMiddleware, roleMiddleware("faculty"), createExam);
examRouter.get("/faculty", authMiddleware, roleMiddleware("faculty"), listFacultyExams);
examRouter.patch("/:id", authMiddleware, roleMiddleware("faculty"), updateExam);
examRouter.patch(
  "/:id/submit-for-approval",
  authMiddleware,
  roleMiddleware("faculty"),
  submitForApproval
);
examRouter.get("/:id/submissions", authMiddleware, roleMiddleware("faculty"), getExamSubmissions);
examRouter.patch(
  "/submissions/:submissionId/grade",
  authMiddleware,
  roleMiddleware("faculty"),
  gradeSubmission
);
examRouter.patch("/:id/publish-results", authMiddleware, roleMiddleware("faculty"), publishResults);
examRouter.get("/:id/analytics", authMiddleware, roleMiddleware("faculty"), getClassAnalytics);

// ── Admin: test approval queue ──
examRouter.get(
  "/admin/pending",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminListPendingExams
);
examRouter.patch(
  "/admin/:id/approve",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminApproveExam
);
examRouter.patch(
  "/admin/:id/reject",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminRejectExam
);

// ── Student ──
examRouter.get("/my", authMiddleware, roleMiddleware("student", "classrep"), listMyExams);
examRouter.post("/:id/start", authMiddleware, roleMiddleware("student", "classrep"), startExam);
examRouter.post("/:id/submit", authMiddleware, roleMiddleware("student", "classrep"), submitExam);
examRouter.get(
  "/:id/analysis",
  authMiddleware,
  roleMiddleware("student", "classrep"),
  getMyAnalysis
);

export default examRouter;
