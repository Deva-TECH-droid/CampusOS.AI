import express from "express";
import { signup, signupTeacher, getTeachersDirectory, login, refresh, logout, getMe, getProfile, updateProfile } from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/signup-teacher", signupTeacher);
authRouter.get("/teachers-directory", getTeachersDirectory);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", authMiddleware, logout);
authRouter.get("/me", authMiddleware, getMe);
authRouter.get("/profile",authMiddleware,getProfile);
authRouter.patch("/profile",authMiddleware,updateProfile);

export default authRouter;