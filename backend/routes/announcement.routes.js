import express from "express";
import { createAnnouncement, deleteAnnouncement, getAnnouncements, getCommunityFeed } from "../controllers/announcement.controller.js";
import authMiddleware from "../middleware/authMiddleware.js"
const announcementRouter = express.Router();
// TODO: import controller and define routes
announcementRouter.post("/:targetType/:targetId",authMiddleware,createAnnouncement);
announcementRouter.get("/:targetType/:targetId",authMiddleware,getAnnouncements);
announcementRouter.get("/community",authMiddleware,getCommunityFeed);
announcementRouter.delete("/:id",authMiddleware,deleteAnnouncement);
export default announcementRouter;
