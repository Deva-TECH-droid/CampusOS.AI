import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { sendMessage, getChatHistory } from "../controllers/chatbot.controller.js";

const chatbotRouter = express.Router();

chatbotRouter.post("/message", authMiddleware, sendMessage);
chatbotRouter.get("/history", authMiddleware, getChatHistory);

export default chatbotRouter;