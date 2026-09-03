import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { sendMessage } from "../controllers/chatbot.controller.js";

const chatbotRouter = express.Router();

// Any authenticated, approved user can talk to the Campus Assistant —
// scoping to what THEY can see happens inside the tools/services later,
// the same way dashboard/notice endpoints already scope by req.user.
chatbotRouter.post("/message", authMiddleware, sendMessage);

export default chatbotRouter;