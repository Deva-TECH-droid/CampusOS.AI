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

// import {
//   applyToDrive,
//   getMyApplications,
//   getApplicationById,
//   updateApplicationStatus,
//   updateApplicationNotes,
//   withdrawApplication,
//   getDriveApplications,
// } from "../controllers/application.controller.js";

const driveRouter = express.Router();

const isCoordinator = roleMiddleware("placementCoordinator", "superadmin");

// ── Dashboard ────────────────────────────────────────────────
driveRouter.get("/dashboard", authMiddleware, getCareerDashboard);

// ── Drives ───────────────────────────────────────────────────
driveRouter.get("/", authMiddleware,getDrives); // public list
driveRouter.get("/:id", authMiddleware,getDriveById); // public detail (eligibility attached if logged in)

driveRouter.post("/", authMiddleware, isCoordinator, createDrive);

// driveRouter.patch(
//   "/drives/:driveId",
//   authMiddleware,
//   isCoordinator,
//   updateDrive,
// );
// driveRouter.delete(
//   "/drives/:driveId",
//   authMiddleware,
//   isCoordinator,
//   deleteDrive,
// );

// // Applications for a specific drive (coordinator view)
// driveRouter.get(
//   "/drives/:driveId/applications",
//   authMiddleware,
//   isCoordinator,
//   getDriveApplications,
// );

export default driveRouter;