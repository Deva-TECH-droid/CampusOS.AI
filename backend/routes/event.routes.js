import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  getUpcomingEvents,
  registerForEvent,
  updateEvent,
} from "../controllers/event.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
const eventRouter = express.Router();
// TODO: import controller and define routes
eventRouter.get("/", authMiddleware, getAllEvents);
eventRouter.post("/create", authMiddleware, createEvent);
eventRouter.put("/:id/update", authMiddleware, updateEvent);
eventRouter.get("/upcoming", authMiddleware, getUpcomingEvents);
eventRouter.get("/:id", authMiddleware, getEventById);
eventRouter.put("/:id/register", authMiddleware, registerForEvent);

export default eventRouter;
