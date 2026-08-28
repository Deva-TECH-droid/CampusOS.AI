import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  deleteDiscussion,
  toggleUpvoteDiscussion,
  toggleBookmark,
  addComment,
  toggleUpvoteComment,
  acceptAnswer,
  deleteComment,
  addReply,
  toggleUpvoteReply,
  deleteReply,
} from "../controllers/discussion.controller.js";

const discussionRouter = express.Router();

// ── Discussions ──────────────────────────────────────────────
discussionRouter.get("/", getDiscussions); // public — list/search
discussionRouter.get("/:id", getDiscussionById); // public — detail + comments
discussionRouter.post("/", authMiddleware, createDiscussion);
discussionRouter.delete("/:id", authMiddleware, deleteDiscussion);
discussionRouter.post("/:id/upvote", authMiddleware, toggleUpvoteDiscussion);
discussionRouter.post("/:id/bookmark", authMiddleware, toggleBookmark);

// ── Comments ─────────────────────────────────────────────────
discussionRouter.post("/:id/comments", authMiddleware, addComment);
discussionRouter.post(
  "/:id/comments/:commentId/upvote",
  authMiddleware,
  toggleUpvoteComment,
);
discussionRouter.post(
  "/:id/comments/:commentId/accept",
  authMiddleware,
  acceptAnswer,
);
discussionRouter.delete(
  "/:id/comments/:commentId",
  authMiddleware,
  deleteComment,
);

// ── Replies ──────────────────────────────────────────────────
discussionRouter.post(
  "/:id/comments/:commentId/replies",
  authMiddleware,
  addReply,
);
discussionRouter.post(
  "/:id/comments/:commentId/replies/:replyId/upvote",
  authMiddleware,
  toggleUpvoteReply,
);
discussionRouter.delete(
  "/:id/comments/:commentId/replies/:replyId",
  authMiddleware,
  deleteReply,
);

export default discussionRouter;
