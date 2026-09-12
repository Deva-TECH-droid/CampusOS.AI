import Feedback from "../models/Feedback.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import ApiError from "../utils/apiError.js";

// ─── POST /api/feedback ───────────────────────────────────────────────────
// Submits 1-5 star feedback with review text
export const submitFeedback = asyncHandler(async (req, res) => {
  const { rating, message, category } = req.body;

  if (!rating || Number(rating) < 1 || Number(rating) > 5) {
    throw new ApiError(400, "Please provide a valid rating between 1 and 5 stars.");
  }

  if (!message || !message.trim()) {
    throw new ApiError(400, "Feedback message cannot be empty.");
  }

  const feedback = await Feedback.create({
    user: req.user?._id || null,
    userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : "Anonymous Student",
    userEmail: req.user?.email || "",
    userRole: req.user?.role || "student",
    rating: Number(rating),
    message: message.trim(),
    category: category || "Campus Assistant",
  });

  return sendResponse(res, 201, "Thank you! Your feedback has been recorded.", { feedback });
});

// ─── GET /api/feedback/admin ──────────────────────────────────────────────
// Superadmin view: all feedbacks + stats (average, distribution)
export const getAdminFeedbacks = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find()
    .sort({ createdAt: -1 })
    .lean();

  const total = feedbacks.length;
  const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
  const average = total > 0 ? (sum / total).toFixed(1) : 0;

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbacks.forEach((f) => {
    if (distribution[f.rating] !== undefined) distribution[f.rating]++;
  });

  return sendResponse(res, 200, "Feedbacks fetched.", {
    feedbacks,
    stats: {
      total,
      average,
      distribution,
    },
  });
});
