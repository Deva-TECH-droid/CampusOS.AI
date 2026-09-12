import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { submitFeedback, getAdminFeedbacks } from "../controllers/feedback.controller.js";

const feedbackRouter = express.Router();

feedbackRouter.post("/", authMiddleware, submitFeedback);
feedbackRouter.get("/admin", authMiddleware, roleMiddleware("superadmin"), getAdminFeedbacks);

export default feedbackRouter;
