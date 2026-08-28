import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getDashboard, globalSearch } from "../controllers/dashboard.controller.js";

const dashboardRouter = express.Router();

// GET /api/dashboard — single authenticated call, returns full dashboard payload
dashboardRouter.get("/", authMiddleware, getDashboard);
dashboardRouter.get("/search",authMiddleware,globalSearch);

export default dashboardRouter;