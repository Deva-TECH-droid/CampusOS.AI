import Discussion from "../models/Discussion.js";
import Comment from "../models/Comment.js";
import Reply from "../models/Reply.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";

// ─────────────────────────────────────────────
// DISCUSSIONS
// ─────────────────────────────────────────────

// GET /api/discussions?category=&search=&sort=newest|popular|unanswered|active&page=1&limit=20
export const getDiscussions = asyncHandler(async (req, res) => {
  const { category, search, sort = "newest", page = 1, limit = 5 } = req.query;

  const query = { isDeleted: false };
  if (category && category !== "all") query.category = category;
  if (search) query.$text = { $search: search };

  const sortMap = {
    newest:     { isPinned: -1, createdAt: -1 },
    popular:    { isPinned: -1, "upvotes.length": -1, views: -1 },
    unanswered: { isPinned: -1, commentCount: 1, createdAt: -1 },
    active:     { isPinned: -1, lastActivityAt: -1 },
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [discussions, total] = await Promise.all([
    Discussion.find(query)
      .populate("author", "firstName lastName branch year")
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Discussion.countDocuments(query),
  ]);

  sendResponse(res, 200, "Discussions fetched.", {
    discussions,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

// GET /api/discussions/:id
export const getDiscussionById = asyncHandler(async (req, res) => {
  const discussion = await Discussion.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { $inc: { views: 1 } },
    { new: true }
  ).populate("author", "firstName lastName branch year role");

  if (!discussion) {
    return res.status(404).json({ success: false, message: "Discussion not found." });
  }

  // Fetch comments (not deleted), accepted answer floats to top
  const comments = await Comment.find({ discussion: req.params.id, isDeleted: false })
    .populate("author", "firstName lastName branch year role")
    .sort({ isAcceptedAnswer: -1, createdAt: 1 })
    .lean();

  // Fetch ALL replies for these comments in one query (flat, includes nested)
  const commentIds = comments.map((c) => c._id);
  const allReplies = await Reply.find({ comment: { $in: commentIds }, isDeleted: false })
    .populate("author", "firstName lastName branch year role")
    .populate("replyingTo", "firstName lastName")
    .sort({ createdAt: 1 })
    .lean();

  // Build nested reply tree per comment
  // Direct replies (parentReply: null) = roots
  // Nested replies (parentReply set)   = children of their parent
  const buildReplyTree = (commentId) => {
    const flat = allReplies.filter(
      (r) => r.comment.toString() === commentId.toString()
    );
    const map = {};
    flat.forEach((r) => { map[r._id.toString()] = { ...r, children: [] }; });

    const roots = [];
    flat.forEach((r) => {
      if (r.parentReply) {
        const parent = map[r.parentReply.toString()];
        // If parent exists attach as child; otherwise promote to root
        if (parent) parent.children.push(map[r._id.toString()]);
        else roots.push(map[r._id.toString()]);
      } else {
        roots.push(map[r._id.toString()]);
      }
    });
    return roots;
  };

  const commentsWithReplies = comments.map((c) => ({
    ...c,
    replies: buildReplyTree(c._id),
  }));

  sendResponse(res, 200, "Discussion fetched.", {
    discussion,
    comments: commentsWithReplies,
  });
});

// POST /api/discussions
export const createDiscussion = asyncHandler(async (req, res) => {
  const { title, content, category, tags } = req.body;

  if (!title?.trim() || !content?.trim() || !category) {
    return res.status(400).json({ success: false, message: "Title, content, and category are required." });
  }

  const discussion = await Discussion.create({
    title: title.trim(),
    content: content.trim(),
    category,
    tags: tags?.map((t) => t.toLowerCase().trim()) || [],
    author: req.user._id,
  });

  await discussion.populate("author", "firstName lastName branch year");
  sendResponse(res, 201, "Discussion created.", discussion);
});

// DELETE /api/discussions/:id  (soft delete — author or superadmin)
export const deleteDiscussion = asyncHandler(async (req, res) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) return res.status(404).json({ success: false, message: "Not found." });

  const isOwner = discussion.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Not authorised." });
  }

  discussion.isDeleted = true;
  await discussion.save();
  sendResponse(res, 200, "Discussion deleted.");
});

// POST /api/discussions/:id/upvote  (toggle)
export const toggleUpvoteDiscussion = asyncHandler(async (req, res) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) return res.status(404).json({ success: false, message: "Not found." });

  const uid = req.user._id.toString();
  const idx = discussion.upvotes.findIndex((u) => u.toString() === uid);
  if (idx > -1) discussion.upvotes.splice(idx, 1);
  else discussion.upvotes.push(req.user._id);

  await discussion.save();
  sendResponse(res, 200, idx > -1 ? "Upvote removed." : "Upvoted.", {
    upvotes: discussion.upvotes.length,
    upvoted: idx === -1,
  });
});

// POST /api/discussions/:id/bookmark  (toggle)
export const toggleBookmark = asyncHandler(async (req, res) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) return res.status(404).json({ success: false, message: "Not found." });

  const uid = req.user._id.toString();
  const idx = discussion.bookmarks.findIndex((u) => u.toString() === uid);
  if (idx > -1) discussion.bookmarks.splice(idx, 1);
  else discussion.bookmarks.push(req.user._id);

  await discussion.save();
  sendResponse(res, 200, idx > -1 ? "Bookmark removed." : "Bookmarked.", {
    bookmarked: idx === -1,
  });
});

// ─────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────

// POST /api/discussions/:id/comments
export const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
    return res.status(400).json({ success: false, message: "Content is required." });
  }

  const discussion = await Discussion.findOne({ _id: req.params.id, isDeleted: false, isLocked: false });
  if (!discussion) {
    return res.status(404).json({ success: false, message: "Discussion not found or locked." });
  }

  const comment = await Comment.create({
    discussion: req.params.id,
    author: req.user._id,
    content: content.trim(),
  });

  await Discussion.findByIdAndUpdate(req.params.id, {
    $inc: { commentCount: 1 },
    lastActivityAt: new Date(),
  });

  await comment.populate("author", "firstName lastName branch year role");
  sendResponse(res, 201, "Comment added.", { ...comment.toObject(), replies: [] });
});

// POST /api/discussions/:id/comments/:commentId/upvote  (toggle)
export const toggleUpvoteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment || comment.isDeleted) return res.status(404).json({ success: false, message: "Not found." });

  const uid = req.user._id.toString();
  const idx = comment.upvotes.findIndex((u) => u.toString() === uid);
  if (idx > -1) comment.upvotes.splice(idx, 1);
  else comment.upvotes.push(req.user._id);

  await comment.save();
  sendResponse(res, 200, "Done.", { upvotes: comment.upvotes.length, upvoted: idx === -1 });
});

// POST /api/discussions/:id/comments/:commentId/accept  (discussion author only)
export const acceptAnswer = asyncHandler(async (req, res) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) return res.status(404).json({ success: false, message: "Not found." });

  if (discussion.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Only the discussion author can accept an answer." });
  }

  await Comment.updateMany({ discussion: req.params.id }, { isAcceptedAnswer: false });
  const comment = await Comment.findByIdAndUpdate(
    req.params.commentId,
    { isAcceptedAnswer: true },
    { new: true }
  );

  sendResponse(res, 200, "Answer accepted.", comment);
});

// DELETE /api/discussions/:id/comments/:commentId  (soft delete)
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ success: false, message: "Not found." });

  const isOwner = comment.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Not authorised." });
  }

  comment.isDeleted = true;
  await comment.save();
  await Discussion.findByIdAndUpdate(req.params.id, { $inc: { commentCount: -1 } });
  sendResponse(res, 200, "Comment deleted.");
});

// ─────────────────────────────────────────────
// REPLIES  (supports reply-to-reply nesting)
// ─────────────────────────────────────────────

// POST /api/discussions/:id/comments/:commentId/replies
// Body: { content, parentReplyId? }
// - parentReplyId absent  → direct reply to comment
// - parentReplyId present → nested reply (reply to a reply)
export const addReply = asyncHandler(async (req, res) => {
  const { content, parentReplyId } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ success: false, message: "Content is required." });
  }

  const comment = await Comment.findOne({ _id: req.params.commentId, isDeleted: false });
  if (!comment) return res.status(404).json({ success: false, message: "Comment not found." });

  let replyingTo = null;

  if (parentReplyId) {
    const parentReply = await Reply.findOne({ _id: parentReplyId, isDeleted: false });
    if (!parentReply) {
      return res.status(404).json({ success: false, message: "Parent reply not found." });
    }
    // Ensure parent reply belongs to the same comment
    if (parentReply.comment.toString() !== req.params.commentId) {
      return res.status(400).json({ success: false, message: "Parent reply does not belong to this comment." });
    }
    replyingTo = parentReply.author;
  }

  const reply = await Reply.create({
    comment:     req.params.commentId,
    parentReply: parentReplyId || null,
    replyingTo,
    author:      req.user._id,
    content:     content.trim(),
  });

  await Comment.findByIdAndUpdate(req.params.commentId, { $inc: { replyCount: 1 } });
  await Discussion.findByIdAndUpdate(req.params.id, { lastActivityAt: new Date() });

  await reply.populate("author", "firstName lastName branch year role");
  await reply.populate("replyingTo", "firstName lastName");

  sendResponse(res, 201, "Reply added.", { ...reply.toObject(), children: [] });
});

// POST /api/discussions/:id/comments/:commentId/replies/:replyId/upvote
export const toggleUpvoteReply = asyncHandler(async (req, res) => {
  const reply = await Reply.findById(req.params.replyId);
  if (!reply || reply.isDeleted) return res.status(404).json({ success: false, message: "Not found." });

  const uid = req.user._id.toString();
  const idx = reply.upvotes.findIndex((u) => u.toString() === uid);
  if (idx > -1) reply.upvotes.splice(idx, 1);
  else reply.upvotes.push(req.user._id);

  await reply.save();
  sendResponse(res, 200, "Done.", { upvotes: reply.upvotes.length, upvoted: idx === -1 });
});

// DELETE /api/discussions/:id/comments/:commentId/replies/:replyId
export const deleteReply = asyncHandler(async (req, res) => {
  const reply = await Reply.findById(req.params.replyId);
  if (!reply) return res.status(404).json({ success: false, message: "Not found." });

  const isOwner = reply.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Not authorised." });
  }

  reply.isDeleted = true;
  await reply.save();
  await Comment.findByIdAndUpdate(req.params.commentId, { $inc: { replyCount: -1 } });
  sendResponse(res, 200, "Reply deleted.");
});