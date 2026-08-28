import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  getDrives,
  getDriveById,
  createDrive,
  updateDrive,
  deleteDrive,
  getCareerDashboard,
} from "../controllers/drive.controller.js";

import {
  applyToDrive,
  getMyApplications,
  getApplicationById,
  updateApplicationStatus,
  updateApplicationNotes,
  withdrawApplication,
  getDriveApplications,
} from "../controllers/application.controller.js";

const careerRouter = express.Router();

const isCoordinator = roleMiddleware("placementCoordinator", "superadmin");

// ── Dashboard ────────────────────────────────────────────────
careerRouter.get("/dashboard", authMiddleware, getCareerDashboard);

// ── Drives ───────────────────────────────────────────────────
careerRouter.get("/drives", getDrives); // public list
careerRouter.get("/drives/:driveId", getDriveById); // public detail (eligibility attached if logged in)

careerRouter.post("/drives", authMiddleware, isCoordinator, createDrive);
careerRouter.patch(
  "/drives/:driveId",
  authMiddleware,
  isCoordinator,
  updateDrive,
);
careerRouter.delete(
  "/drives/:driveId",
  authMiddleware,
  isCoordinator,
  deleteDrive,
);

// Applications for a specific drive (coordinator view)
careerRouter.get(
  "/drives/:driveId/applications",
  authMiddleware,
  isCoordinator,
  getDriveApplications,
);

// ── Applications ─────────────────────────────────────────────
careerRouter.post("/drives/:driveId/apply", authMiddleware, applyToDrive);

careerRouter.get("/applications/mine", authMiddleware, getMyApplications);
careerRouter.get("/applications/:id", authMiddleware, getApplicationById);

careerRouter.patch(
  "/applications/:id/status",
  authMiddleware,
  isCoordinator,
  updateApplicationStatus,
);
careerRouter.patch(
  "/applications/:id/notes",
  authMiddleware,
  updateApplicationNotes,
);
careerRouter.delete(
  "/applications/:id/withdraw",
  authMiddleware,
  withdrawApplication,
);

export default careerRouter;
