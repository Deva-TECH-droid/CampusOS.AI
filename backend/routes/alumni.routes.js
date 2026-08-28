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
  adminListAlumni,
  adminPromoteToAlumni,
} from "../controllers/alumni.controller.js";

const alumniRouter = express.Router();

// ── Browse (everyone logged in) ──
alumniRouter.get("/stories", authMiddleware, listStories);
alumniRouter.get("/stories/mine", authMiddleware, roleMiddleware("alumni"), listMyStories);
alumniRouter.get("/stories/:id", authMiddleware, getStory);
alumniRouter.patch("/stories/:id/like", authMiddleware, toggleLike);

// ── Alumni ──
alumniRouter.post("/stories", authMiddleware, roleMiddleware("alumni"), createStory);
alumniRouter.patch("/stories/:id", authMiddleware, roleMiddleware("alumni"), updateStory);
alumniRouter.delete("/stories/:id", authMiddleware, roleMiddleware("alumni", "superadmin"), deleteStory);

// ── Admin ──
alumniRouter.get("/admin/list", authMiddleware, roleMiddleware("superadmin"), adminListAlumni);
alumniRouter.post(
  "/admin/promote",
  authMiddleware,
  roleMiddleware("superadmin"),
  adminPromoteToAlumni
);

export default alumniRouter;
