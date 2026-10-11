import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireApproved from "../middleware/statusMiddleware.js";
import { handleSingleUpload, getExtension } from "../middleware/multerMiddleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";

const uploadRouter = Router();

// ?folder= is user-controlled and ends up in a Cloudinary path, so only
// accept a short slug; anything else falls back to "general".
const safeFolder = (raw) =>
  typeof raw === "string" && /^[a-z0-9_-]{1,40}$/i.test(raw) ? raw : "general";

// POST /api/v1/upload
// Order matters: auth and approval are checked BEFORE multer runs, so an
// unauthenticated request is rejected without any file being written to disk.
uploadRouter.post(
  "/",
  authMiddleware,
  requireApproved,
  handleSingleUpload,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    // Read these before uploading -- the temp file is deleted afterwards.
    const fileSize = req.file.size;
    const fileType = getExtension(req.file.originalname);
    const originalName = req.file.originalname;

    const folderTarget = safeFolder(req.query.folder);
    const result = await uploadOnCloudinary(req.file.path, `eventsphere/${folderTarget}`);

    if (!result) {
      return res.status(500).json({ success: false, message: "Cloud deployment execution crashed." });
    }

    return res.status(200).json({
      success: true,
      message: "File deployed to cloud infrastructure successfully.",
      url: result.secure_url,
      publicId: result.public_id,
      fileSize,
      fileType,
      originalName,
    });
  }),
);

export default uploadRouter;