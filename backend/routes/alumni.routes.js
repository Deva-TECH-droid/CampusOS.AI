import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  createStory,
  listMyStories,
  updateStory,
  deleteStory,
  listStories,
  getStory,
  toggleLike,
  addComment,
  deleteComment,
  createAlumniTalk,
  listAlumniTalks,
  deleteAlumniTalk,
  adminListAlumni,
  adminPromoteToAlumni,
} from "../controllers/alumni.controller.js";

const alumniRouter = express.Router();

// ── Alumni Talks (Req 14) ──
alumniRouter.get("/talks", authMiddleware, listAlumniTalks);
alumniRouter.post(
  "/talks",
  authMiddleware,
  roleMiddleware("superadmin"),
  createAlumniTalk
);
alumniRouter.delete(
  "/talks/:id",
  authMiddleware,
  roleMiddleware("superadmin"),
  deleteAlumniTalk
);

// ── Browse Stories & Experience Posts ──
alumniRouter.get("/stories", authMiddleware, listStories);
alumniRouter.get("/stories/mine", authMiddleware, roleMiddleware("alumni"), listMyStories);
alumniRouter.get("/stories/:id", authMiddleware, getStory);
alumniRouter.patch("/stories/:id/like", authMiddleware, toggleLike);

// ── Community Comments (Req 16) ──
alumniRouter.post("/stories/:id/comments", authMiddleware, addComment);
alumniRouter.delete("/stories/:id/comments/:commentId", authMiddleware, deleteComment);

// ── Alumni & Admin Post Creation (Req 15 & 16) ──
alumniRouter.post(
  "/stories",
  authMiddleware,
  roleMiddleware("alumni", "superadmin"),
  createStory
);
alumniRouter.patch(
  "/stories/:id",
  authMiddleware,
  roleMiddleware("alumni", "superadmin"),
  updateStory
);
alumniRouter.delete(
  "/stories/:id",
  authMiddleware,
  roleMiddleware("alumni", "superadmin"),
  deleteStory
);

// ── Admin: promote to alumni ──
alumniRouter.get("/admin/list", authMiddleware, roleMiddleware("superadmin"), adminListAlumni);
alumniRouter.post(
  "/admin/promote",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminPromoteToAlumni
);

export default alumniRouter;
