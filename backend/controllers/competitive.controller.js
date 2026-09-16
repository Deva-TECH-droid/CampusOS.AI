import CompetitiveResource from "../models/CompetitiveResource.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";

// ─── GET /api/competitive?category= ──────────────────────────────────────
// Only ever returns verified resources -- unverified submissions are
// invisible to everyone except the submitter and superadmin, by design.
export const listResources = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const query = { isVerified: true };
  if (category) query.category = category;

  const resources = await CompetitiveResource.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return sendResponse(res, 200, "Resources fetched.", { resources });
});

// ─── POST /api/competitive ────────────────────────────────────────────────
export const submitResource = asyncHandler(async (req, res) => {
  const { title, description, url, category, type, platform } = req.body;

  if (!title?.trim() || !url?.trim() || !category) {
    return res
      .status(400)
      .json({ success: false, message: "title, url and category are required." });
  }

  const resource = await CompetitiveResource.create({
    title: title.trim(),
    description: description?.trim() || "",
    url: url.trim(),
    category,
    type: type || "other",
    platform: platform?.trim() || "",
    submittedBy: req.user._id,
  });

  return sendResponse(res, 201, "Resource submitted for review.", { resource });
});

// ─── GET /api/competitive/admin/pending ──────────────────────────────────
export const listPendingResources = asyncHandler(async (req, res) => {
  const resources = await CompetitiveResource.find({ isVerified: false })
    .populate("submittedBy", "firstName lastName email")
    .sort({ createdAt: -1 })
    .lean();

  return sendResponse(res, 200, "Pending resources fetched.", { resources });
});

// ─── PATCH /api/competitive/admin/:id/verify ─────────────────────────────
export const verifyResource = asyncHandler(async (req, res) => {
  const resource = await CompetitiveResource.findById(req.params.id);
  if (!resource) {
    return res.status(404).json({ success: false, message: "Not found." });
  }
  resource.isVerified = true;
  resource.verifiedBy = req.user._id;
  await resource.save();
  return sendResponse(res, 200, "Resource approved.");
});

// ─── DELETE /api/competitive/admin/:id ────────────────────────────────────
// Used for rejecting a pending submission (or removing a bad verified one).
export const deleteResource = asyncHandler(async (req, res) => {
  const resource = await CompetitiveResource.findByIdAndDelete(req.params.id);
  if (!resource) {
    return res.status(404).json({ success: false, message: "Not found." });
  }
  return sendResponse(res, 200, "Resource removed.");
});