import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createNotice,
  getNotices,
  getNoticeById,
  deleteNotice,
  togglePin,
  archiveNotice,
} from "../controllers/notice.controller.js";

const noticeRouter = express.Router();

// Public — any logged in user can read notices for their target
noticeRouter.get("/",     authMiddleware, getNotices);
noticeRouter.get("/:id",  authMiddleware, getNoticeById);

// Write — auth required; controller enforces role-based permission per targetType
noticeRouter.post("/",              authMiddleware, createNotice);
noticeRouter.delete("/:id",         authMiddleware, deleteNotice);
noticeRouter.patch("/:id/pin",      authMiddleware, togglePin);
noticeRouter.patch("/:id/archive",  authMiddleware, archiveNotice);

export default noticeRouter;