import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { uploadNote, deleteNote, listFacultyNotes, listMyNotes } from "../controllers/note.controller.js";

const noteRouter = express.Router();

noteRouter.post("/", authMiddleware, roleMiddleware("faculty"), uploadNote);
noteRouter.delete("/:id", authMiddleware, roleMiddleware("faculty"), deleteNote);
noteRouter.get("/faculty", authMiddleware, roleMiddleware("faculty"), listFacultyNotes);
noteRouter.get("/my", authMiddleware, roleMiddleware("student", "classrep"), listMyNotes);

export default noteRouter;
