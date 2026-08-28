import User from "../models/User.js";
import AlumniStory from "../models/AlumniStory.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import ApiError from "../utils/apiError.js";

// ══════════════════════════ Alumni ═══════════════════════════════

// ── POST /api/alumni/stories ────────────────────────────────────────
export const createStory = asyncHandler(async (req, res) => {
  const { title, company, role, content, adviceForJuniors, tags } = req.body;

  if (!title || !company || !role || !content) {
    throw new ApiError(400, "title, company, role and content are required.");
  }

  const story = await AlumniStory.create({
    alumnus: req.user._id,
    title,
    company,
    role,
    graduationYear: req.user.alumniProfile?.graduationYear,
    branch: req.user.branch,
    content,
    adviceForJuniors: adviceForJuniors || "",
    tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
  });

  return sendResponse(res, 201, "Story shared.", { story });
});

// ── GET /api/alumni/stories/mine ─────────────────────────────────────
export const listMyStories = asyncHandler(async (req, res) => {
  const stories = await AlumniStory.find({ alumnus: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  return sendResponse(res, 200, "Stories fetched.", { stories });
});

// ── PATCH /api/alumni/stories/:id ────────────────────────────────────
export const updateStory = asyncHandler(async (req, res) => {
  const story = await AlumniStory.findOne({ _id: req.params.id, alumnus: req.user._id });
  if (!story) throw new ApiError(404, "Story not found.");

  const editable = ["title", "company", "role", "content", "adviceForJuniors", "tags"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) story[field] = req.body[field];
  });
  await story.save();

  return sendResponse(res, 200, "Story updated.", { story });
});

// ── DELETE /api/alumni/stories/:id ───────────────────────────────────
export const deleteStory = asyncHandler(async (req, res) => {
  const isOwner = await AlumniStory.findOne({ _id: req.params.id, alumnus: req.user._id });
  if (!isOwner && req.user.role !== "superadmin") {
    throw new ApiError(404, "Story not found.");
  }
  await AlumniStory.deleteOne({ _id: req.params.id });
  return sendResponse(res, 200, "Story deleted.");
});

// ══════════════════════════ Everyone (browse) ═════════════════════

// ── GET /api/alumni/stories ──────────────────────────────────────────
// Query: ?branch=&company=&search=
export const listStories = asyncHandler(async (req, res) => {
  const { branch, company, search } = req.query;

  const filter = {};
  if (branch) filter.branch = branch;
  if (company) filter.company = new RegExp(company, "i");
  if (search) {
    filter.$or = [
      { title: new RegExp(search, "i") },
      { content: new RegExp(search, "i") },
      { tags: new RegExp(search, "i") },
    ];
  }

  const stories = await AlumniStory.find(filter)
    .populate("alumnus", "firstName lastName profilePicture linkedin")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return sendResponse(res, 200, "Stories fetched.", {
    stories: stories.map((s) => ({ ...s, likeCount: s.likes?.length || 0, likes: undefined })),
  });
});

// ── GET /api/alumni/stories/:id ──────────────────────────────────────
export const getStory = asyncHandler(async (req, res) => {
  const story = await AlumniStory.findById(req.params.id)
    .populate("alumnus", "firstName lastName profilePicture linkedin github portfolio bio")
    .lean();
  if (!story) throw new ApiError(404, "Story not found.");

  return sendResponse(res, 200, "Story fetched.", {
    story: { ...story, likeCount: story.likes?.length || 0, likes: undefined },
  });
});

// ── PATCH /api/alumni/stories/:id/like ────────────────────────────────
export const toggleLike = asyncHandler(async (req, res) => {
  const story = await AlumniStory.findById(req.params.id);
  if (!story) throw new ApiError(404, "Story not found.");

  const alreadyLiked = story.likes.some((id) => id.toString() === req.user._id.toString());
  if (alreadyLiked) {
    story.likes = story.likes.filter((id) => id.toString() !== req.user._id.toString());
  } else {
    story.likes.push(req.user._id);
  }
  await story.save();

  return sendResponse(res, 200, alreadyLiked ? "Unliked." : "Liked.", {
    likeCount: story.likes.length,
    liked: !alreadyLiked,
  });
});

// ══════════════════════════ Admin ══════════════════════════════════

// ── GET /api/alumni/admin/list ────────────────────────────────────────
export const adminListAlumni = asyncHandler(async (req, res) => {
  const alumni = await User.find({ role: "alumni" })
    .select("firstName lastName email branch alumniProfile")
    .sort({ firstName: 1 })
    .lean();
  return sendResponse(res, 200, "Alumni fetched.", { alumni });
});

// ── POST /api/alumni/admin/promote ────────────────────────────────────
// Body: { email, graduationYear, currentCompany, currentRole }
// Promotes an existing user (typically a graduating student) to alumni.
export const adminPromoteToAlumni = asyncHandler(async (req, res) => {
  const { email, graduationYear, currentCompany, currentRole } = req.body;
  if (!email) throw new ApiError(400, "email is required.");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "No user found with that email.");

  user.role = "alumni";
  user.alumniProfile = {
    graduationYear: graduationYear || user.year,
    currentCompany: currentCompany || "",
    currentRole: currentRole || "",
  };
  await user.save({ validateModifiedOnly: true });

  return sendResponse(res, 200, `${user.firstName} promoted to alumni.`, { user });
});
