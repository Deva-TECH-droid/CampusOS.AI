import { Router } from "express";
import { upload } from "../middleware/multerMiddleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";

const uploadRouter = Router();

// POST /api/v1/upload
uploadRouter.post("/", upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded." });
  }

  // Determine subfolder dynamically using a query parameter if passed (e.g. ?folder=banners)
  const folderTarget = req.query.folder || "general";
  const result = await uploadOnCloudinary(req.file.path, `eventsphere/${folderTarget}`);

  if (!result) {
    return res.status(500).json({ success: false, message: "Cloud deployment execution crashed." });
  }

  return res.status(200).json({
    success: true,
    message: "File deployed to cloud infrastructure successfully.",
    url: result.secure_url,
    publicId: result.public_id,
  });
}));

export default uploadRouter;