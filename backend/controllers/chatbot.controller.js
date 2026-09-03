import ChatMessage from "../models/ChatMessage.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";

// ─── POST /api/chatbot/message ─────────────────────────────────────────────
// Milestone 1: prove the auth + persistence path end to end before any
// external system (n8n) is involved. The reply is a hardcoded stub — it
// gets replaced with the real n8n round trip in Milestone 3, without this
// route's contract (request/response shape) changing.
export const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, message: "Message is required." });
  }

  // req.user is set by authMiddleware — same trusted identity every other
  // route in this app already relies on. Nothing chatbot-specific here.
  const userId = req.user._id;

  await ChatMessage.create({
    user: userId,
    role: "user",
    content: message.trim(),
  });

  // TODO (Milestone 3): replace this stub with the real call to
  // chatbotGateway.service.js, which forwards to the n8n webhook.
  const replyText =
    "Thanks for your message! The Campus Assistant is still being wired up — full answers are coming soon.";

  const assistantMessage = await ChatMessage.create({
    user: userId,
    role: "assistant",
    content: replyText,
  });

  return sendResponse(res, 200, "Message sent.", {
    reply: assistantMessage.content,
    messageId: assistantMessage._id,
  });
});