import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv"

dotenv.config();
// Configure credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary and deletes the local temporary file safely.
 * @param {string} localFilePath - Path to the temp file saved by multer
 * @param {string} folder - Destination folder name inside Cloudinary dashboard
 */
export const uploadOnCloudinary = async (localFilePath, folder = "eventsphere") => {
  try {
    if (!localFilePath) return null;

    // Upload file to cloud asset storage pipeline
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Handles images, raw files, pdfs automatically
      folder: folder
    });

    // File uploaded successfully, remove local storage temp copy
    fs.unlinkSync(localFilePath);
    return response; // Contains .secure_url, .public_id, etc.
  } catch (error) {
    // If upload fails, remove the corrupted temp file from server storage safely anyway
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error("Cloudinary upload failed utility error:", error);
    return null;
  }
};