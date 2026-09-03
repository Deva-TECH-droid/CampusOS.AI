import express from "express";
import internalAuthMiddleware from "../middleware/internalAuthMiddleware.js";
import { getUpcomingDeadlines } from "../controllers/internalChatbot.controller.js";

const internalRouter = express.Router();

// Every route here is only ever called by n8n's HTTP Request tool nodes —
// never by the frontend, never by a browser. That's why it's gated by
// internalAuthMiddleware (shared secret) instead of the cookie-based
// authMiddleware everything else in this app uses.
internalRouter.post("/deadlines", internalAuthMiddleware, getUpcomingDeadlines);

export default internalRouter;