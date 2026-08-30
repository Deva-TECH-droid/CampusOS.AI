import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  upsertDeadline,
  getClassroom,
  getDeadlines,
  deletDeadline,
  adminListAllClassrooms,
  adminCreateClassroom,
  adminDeleteClassroom,
  adminAddPeriod,
  adminRemovePeriod,
} from "../controllers/classroom.controller.js";
const classRoomRouter = express.Router();

classRoomRouter.get("/", authMiddleware, getClassroom);
classRoomRouter.post("/:classroomId/deadline/save/:deadlineId?", authMiddleware, upsertDeadline);
classRoomRouter.get("/:id/deadlines", authMiddleware, getDeadlines);
classRoomRouter.delete("/:classroomId/deadline/delete/:deadlineId", authMiddleware, deletDeadline);

// ── Admin: manage classrooms ──
classRoomRouter.get(
  "/admin/all",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminListAllClassrooms
);
classRoomRouter.post(
  "/admin/create",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminCreateClassroom
);
classRoomRouter.delete(
  "/admin/:id",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminDeleteClassroom
);
classRoomRouter.post(
  "/admin/:id/periods",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminAddPeriod
);
classRoomRouter.delete(
  "/admin/:id/periods/:day/:index",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminRemovePeriod
);

export default classRoomRouter;