import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  listResources,
  submitResource,
  listPendingResources,
  verifyResource,
  deleteResource,
} from "../controllers/competitive.controller.js";

const competitiveRouter = express.Router();

competitiveRouter.get("/", authMiddleware, listResources);
competitiveRouter.post("/", authMiddleware, submitResource);

competitiveRouter.get(
  "/admin/pending",
  authMiddleware,
  roleMiddleware("superadmin"),
  listPendingResources,
);
competitiveRouter.patch(
  "/admin/:id/verify",
  authMiddleware,
  roleMiddleware("superadmin"),
  verifyResource,
);
competitiveRouter.delete(
  "/admin/:id",
  authMiddleware,
  roleMiddleware("superadmin"),
  deleteResource,
);

export default competitiveRouter;