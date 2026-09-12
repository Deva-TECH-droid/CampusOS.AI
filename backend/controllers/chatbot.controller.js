import ChatMessage from "../models/ChatMessage.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import { answerCampusQuery } from "../services/chatbotQuery.service.js";

// ─── POST /api/chatbot/message ─────────────────────────────────────────────
export const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, message: "Message is required." });
  }

  const userId = req.user?._id;

  if (userId) {
    await ChatMessage.create({
      user: userId,
      role: "user",
      content: message.trim(),
    });
  }

  // Generate real dynamic answer querying database entities
  const replyText = await answerCampusQuery(message.trim(), req.user);

  let assistantMessage = null;
  if (userId) {
    assistantMessage = await ChatMessage.create({
      user: userId,
      role: "assistant",
      content: replyText,
    });
  }

  return sendResponse(res, 200, "Message sent.", {
    reply: replyText,
    messageId: assistantMessage?._id,
  });
});

// ─── GET /api/chatbot/history ─────────────────────────────────────────────
export const getChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return sendResponse(res, 200, "History fetched.", { messages: [] });
  }

  const messages = await ChatMessage.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  return sendResponse(res, 200, "History fetched.", {
    messages: messages.reverse(),
  });
});