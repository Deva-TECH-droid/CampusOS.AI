import multer from "multer";
import path from "path";
import fs from "fs";
import ApiError from "../utils/apiError.js";

// Ensure local temporary directory path structure exists
const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

// Deliberately generous for academic use (assignment submissions include
// code, archives and notebooks), but excludes anything a browser could
// execute or render as a page: html/htm/svg, scripts, executables.
// Extend this list in one place if a legitimate type is missing.
export const ALLOWED_EXTENSIONS = new Set([
  // images
  "jpg", "jpeg", "png", "webp", "gif",
  // documents
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "odt", "rtf", "txt", "csv", "md",
  // archives
  "zip",
  // code / data commonly submitted as coursework
  "py", "java", "c", "cpp", "h", "hpp", "js", "ts", "ipynb", "json", "sql",
]);

export const getExtension = (filename = "") =>
  path.extname(filename).toLowerCase().replace(".", "");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Append a unique suffix to prevent file naming duplication collisions
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const ext = getExtension(file.originalname);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new ApiError(
        400,
        `.${ext || "unknown"} files aren't allowed. Upload a document, image, archive or source file.`,
      ),
    );
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter,
});

// Wraps upload.single("file") so multer/filter failures come back as clean
// JSON the frontend can display, instead of falling through to a generic 500.
export const handleSingleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? `File is too large. Maximum size is ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`
          : err.message;
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ success: false, message });
    }

    return res
      .status(err.statusCode || 400)
      .json({ success: false, message: err.message || "Upload failed." });
  });
};