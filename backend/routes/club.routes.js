import express from "express";
import {
  followClub,
  getAllClubs,
  getClubDetails,
  getPopularClubs,
  updateClub,
} from "../controllers/club.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const clubRouter = express.Router();

clubRouter.get("/", authMiddleware, getAllClubs);
clubRouter.get("/popular",authMiddleware,getPopularClubs);
clubRouter.get("/:clubId", authMiddleware, getClubDetails);
clubRouter.put("/:clubId/follow",authMiddleware, followClub); 
clubRouter.put("/:clubId/update",authMiddleware,updateClub);

export default clubRouter;
