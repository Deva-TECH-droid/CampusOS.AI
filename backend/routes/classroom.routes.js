import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { upsertDeadline, getClassroom, getDeadlines, deletDeadline } from "../controllers/classroom.controller.js";
const classRoomRouter = express.Router();
// TODO: import controller and define routes
classRoomRouter.get("/",authMiddleware,getClassroom)
classRoomRouter.post("/:classroomId/deadline/save/:deadlineId?",authMiddleware,upsertDeadline)
classRoomRouter.get("/:id/deadlines",authMiddleware,getDeadlines)
classRoomRouter.delete("/:classroomId/deadline/delete/:deadlineId",authMiddleware,deletDeadline)

export default classRoomRouter;
