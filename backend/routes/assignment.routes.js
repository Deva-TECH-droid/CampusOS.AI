import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  listFacultyAssignments,
  getSubmissions,
  gradeSubmission,
  listMyAssignments,
  submitAssignment,
} from "../controllers/assignment.controller.js";

const assignmentRouter = express.Router();

// ── Faculty ──
assignmentRouter.post("/", authMiddleware, roleMiddleware("faculty"), createAssignment);
assignmentRouter.get("/faculty", authMiddleware, roleMiddleware("faculty"), listFacultyAssignments);
assignmentRouter.patch("/:id", authMiddleware, roleMiddleware("faculty"), updateAssignment);
assignmentRouter.delete("/:id", authMiddleware, roleMiddleware("faculty"), deleteAssignment);
assignmentRouter.get("/:id/submissions", authMiddleware, roleMiddleware("faculty"), getSubmissions);
assignmentRouter.patch(
  "/submissions/:submissionId/grade",
  authMiddleware,
  roleMiddleware("faculty"),
  gradeSubmission
);

// ── Student ──
assignmentRouter.get("/my", authMiddleware, roleMiddleware("student", "classrep"), listMyAssignments);
assignmentRouter.post(
  "/:id/submit",
  authMiddleware,
  roleMiddleware("student", "classrep"),
  submitAssignment
);

export default assignmentRouter;
