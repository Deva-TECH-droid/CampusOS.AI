import User from "../models/User.js";
import AlumniStory from "../models/AlumniStory.js";
import AlumniTalk from "../models/AlumniTalk.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import ApiError from "../utils/apiError.js";

// ══════════════════════════ Alumni Talks (Req 14) ═════════════════

// ── POST /api/alumni/talks ──────────────────────────────────────────
// Admin creates an alumni talk
export const createAlumniTalk = asyncHandler(async (req, res) => {
  const { speaker, topic, company, date, time, venue, meetingUrl, description, banner, speakerBio } = req.body;

  if (!speaker || !topic || !company || !date || !time || !description) {
    throw new ApiError(400, "speaker, topic, company, date, time and description are required.");
  }

  const talk = await AlumniTalk.create({
    speaker,
    topic,
    company,
    date,
    time,
    venue: venue || "Auditorium / Virtual Meet",
    meetingUrl: meetingUrl || "",
    description,
    banner: banner || "",
    speakerBio: speakerBio || "",
    createdBy: req.user._id,
  });

  return sendResponse(res, 201, `Alumni Talk "${topic}" created successfully.`, { talk });
});

// ── GET /api/alumni/talks ───────────────────────────────────────────
// Anyone logged in can view upcoming alumni talks
export const listAlumniTalks = asyncHandler(async (req, res) => {
  const talks = await AlumniTalk.find()
    .sort({ createdAt: -1 })
    .lean();

  return sendResponse(res, 200, "Alumni talks fetched.", { talks });
});

// ── DELETE /api/alumni/talks/:id ────────────────────────────────────
export const deleteAlumniTalk = asyncHandler(async (req, res) => {
  const talk = await AlumniTalk.findByIdAndDelete(req.params.id);
  if (!talk) throw new ApiError(404, "Alumni talk not found.");
  return sendResponse(res, 200, "Alumni talk deleted.");
});

// ══════════════════════════ Alumni Experience & Projects (Req 15 & 16) ═════════════════════════

// ── POST /api/alumni/stories ────────────────────────────────────────
// Only Alumni and Superadmin can create posts (Req 16 RBAC)
export const createStory = asyncHandler(async (req, res) => {
  const { title, company, role, content, adviceForJuniors, githubLink, projectLink, images, postType, tags } = req.body;

  if (!title || !content) {
    throw new ApiError(400, "title and content are required.");
  }

  const story = await AlumniStory.create({
    alumnus: req.user._id,
    title,
    company: company || req.user.alumniProfile?.currentCompany || "Alumni Network",
    role: role || req.user.alumniProfile?.currentRole || "Alumnus",
    graduationYear: req.user.alumniProfile?.graduationYear || new Date().getFullYear(),
    branch: req.user.branch || "General",
    content,
    adviceForJuniors: adviceForJuniors || "",
    githubLink: githubLink || "",
    projectLink: projectLink || "",
    images: Array.isArray(images) ? images : [],
    postType: postType || "experience",
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
  const story = await AlumniStory.findOne({ _id: req.params.id });
  if (!story) throw new ApiError(404, "Story not found.");

  if (story.alumnus.toString() !== req.user._id.toString() && req.user.role !== "superadmin") {
    throw new ApiError(403, "You can only edit your own posts.");
  }

  const editable = ["title", "company", "role", "content", "adviceForJuniors", "githubLink", "projectLink", "images", "tags", "postType"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) story[field] = req.body[field];
  });
  await story.save();

  return sendResponse(res, 200, "Story updated.", { story });
});

// ── DELETE /api/alumni/stories/:id ───────────────────────────────────
export const deleteStory = asyncHandler(async (req, res) => {
  const story = await AlumniStory.findById(req.params.id);
  if (!story) throw new ApiError(404, "Story not found.");

  if (story.alumnus.toString() !== req.user._id.toString() && req.user.role !== "superadmin") {
    throw new ApiError(403, "You can only delete your own posts.");
  }

  await AlumniStory.deleteOne({ _id: req.params.id });
  return sendResponse(res, 200, "Story deleted.");
});

// ══════════════════════════ Browse & Community Comments ═════════════

// ── GET /api/alumni/stories ──────────────────────────────────────────
export const listStories = asyncHandler(async (req, res) => {
  const { branch, company, search, type } = req.query;

  const filter = {};
  if (branch) filter.branch = branch;
  if (company) filter.company = new RegExp(company, "i");
  if (type) filter.postType = type;
  if (search) {
    filter.$or = [
      { title: new RegExp(search, "i") },
      { content: new RegExp(search, "i") },
      { tags: new RegExp(search, "i") },
    ];
  }

  const stories = await AlumniStory.find(filter)
    .populate("alumnus", "firstName lastName profilePicture linkedin github role")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return sendResponse(res, 200, "Stories fetched.", {
    stories: stories.map((s) => ({
      ...s,
      likeCount: s.likes?.length || 0,
      commentCount: s.comments?.length || 0,
      hasLiked: (s.likes || []).some((id) => id.toString() === req.user._id.toString()),
    })),
  });
});

// ── GET /api/alumni/stories/:id ──────────────────────────────────────
export const getStory = asyncHandler(async (req, res) => {
  const story = await AlumniStory.findById(req.params.id)
    .populate("alumnus", "firstName lastName profilePicture linkedin github portfolio bio role")
    .populate("comments.author", "firstName lastName profilePicture role")
    .lean();

  if (!story) throw new ApiError(404, "Story not found.");

  return sendResponse(res, 200, "Story fetched.", {
    story: {
      ...story,
      likeCount: story.likes?.length || 0,
      hasLiked: (story.likes || []).some((id) => id.toString() === req.user._id.toString()),
    },
  });
});

// ── PATCH /api/alumni/stories/:id/like ───────────────────────────────
export const toggleLike = asyncHandler(async (req, res) => {
  const story = await AlumniStory.findById(req.params.id);
  if (!story) throw new ApiError(404, "Story not found.");

  const userId = req.user._id;
  const idx = story.likes.findIndex((id) => id.toString() === userId.toString());

  let liked;
  if (idx >= 0) {
    story.likes.splice(idx, 1);
    liked = false;
  } else {
    story.likes.push(userId);
    liked = true;
  }
  await story.save();

  return sendResponse(res, 200, liked ? "Liked." : "Unliked.", {
    liked,
    likeCount: story.likes.length,
  });
});

// ── POST /api/alumni/stories/:id/comments ────────────────────────────
// Students, teachers, and alumni can comment (Req 16)
export const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    throw new ApiError(400, "Comment text is required.");
  }

  const story = await AlumniStory.findById(req.params.id);
  if (!story) throw new ApiError(404, "Story not found.");

  const newComment = {
    author: req.user._id,
    authorName: `${req.user.firstName} ${req.user.lastName}`,
    authorRole: req.user.role || "student",
    content: content.trim(),
    createdAt: new Date(),
  };

  story.comments.push(newComment);
  await story.save();

  return sendResponse(res, 201, "Comment added.", {
    comment: newComment,
    comments: story.comments,
  });
});

// ── DELETE /api/alumni/stories/:id/comments/:commentId ───────────────
export const deleteComment = asyncHandler(async (req, res) => {
  const story = await AlumniStory.findById(req.params.id);
  if (!story) throw new ApiError(404, "Story not found.");

  const comment = story.comments.id(req.params.commentId);
  if (!comment) throw new ApiError(404, "Comment not found.");

  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "superadmin") {
    throw new ApiError(403, "You can only delete your own comments.");
  }

  comment.deleteOne();
  await story.save();

  return sendResponse(res, 200, "Comment deleted.");
});

// ══════════════════════════ Admin: Alumni management ════════════════

export const adminListAlumni = asyncHandler(async (req, res) => {
  const alumni = await User.find({ role: "alumni" })
    .select("firstName lastName email branch alumniProfile createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return sendResponse(res, 200, "Alumni fetched.", { alumni });
});

export const adminPromoteToAlumni = asyncHandler(async (req, res) => {
  const { email, graduationYear, currentCompany, currentRole } = req.body;

  if (!email) throw new ApiError(400, "email is required.");

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, "No account with that email was found.");

  user.role = "alumni";
  user.alumniProfile = {
    graduationYear: graduationYear ? Number(graduationYear) : new Date().getFullYear(),
    currentCompany: currentCompany || "",
    currentRole: currentRole || "",
  };
  await user.save({ validateModifiedOnly: true });

  return sendResponse(res, 200, `${user.firstName} is now marked as Alumni.`, { user });
});
