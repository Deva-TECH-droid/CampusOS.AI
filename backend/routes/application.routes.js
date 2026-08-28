import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import {
  applyToDrive,
  getMyApplications,
  getApplicationById,
  updateApplicationStatus,
  updateApplicationNotes,
  withdrawApplication,
  getDriveApplications,
} from "../controllers/application.controller.js";

const applicationRouter = express.Router();
const isCoordinator = roleMiddleware("placementCoordinator", "superadmin");

applicationRouter.post("/drive/:driveId", authMiddleware, applyToDrive);

applicationRouter.get("/my", authMiddleware, getMyApplications);
applicationRouter.get("/applications/:id", authMiddleware, getApplicationById);

applicationRouter.patch(
  "/applications/:id/status",
  authMiddleware,
  isCoordinator,
  updateApplicationStatus,
);
applicationRouter.patch(
  "/applications/:id/notes",
  authMiddleware,
  updateApplicationNotes,
);
applicationRouter.delete(
  "/applications/:id/withdraw",
  authMiddleware,
  withdrawApplication,
);

export default applicationRouter;
