import Notice from "../models/Notice.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import mongoose from "mongoose";
import Drive from "../models/Drive.js";
import Application from "../models/Application.js";

// ─── permission check ─────────────────────────────────────────────────────────
// Returns true if the user is allowed to post a notice for the given targetType
// Full enforcement is done in middleware chains on routes, but this guard
// gives controllers a second layer and a clear error message.
const canPost = (user, targetType) => {
  switch (targetType) {
    case "platform":
      return user.role === "superadmin";
    case "drive":
      return ["placementCoordinator", "superadmin"].includes(user.role);
    case "classroom":
      return ["classRep", "superadmin"].includes(user.role);
    // club + event: checked via clubAdminMiddleware on the route level
    case "clubs":
    case "events":
      return true; // route is already guarded by clubAdminMiddleware
    default:
      return false;
  }
};

// ─── POST /api/notices ────────────────────────────────────────────────────────
export const createNotice = asyncHandler(async (req, res) => {
  const {
    title,
    content,
    targetType,
    targetId,
    noticeType,
    priority,
    metadata,
    expiresAt,
    attachments,
  } = req.body;

  if (!title?.trim() || !content?.trim() || !targetType) {
    return res.status(400).json({
      success: false,
      message: "Title, content, and targetType are required.",
    });
  }

  if (!canPost(req.user, targetType)) {
    return res.status(403).json({
      success: false,
      message: "You are not authorised to post this type of notice.",
    });
  }

  // platform notices don't need a targetId
  if (targetType !== "platform" && !targetId) {
    return res.status(400).json({
      success: false,
      message: "targetId is required for non-platform notices.",
    });
  }

  const notice = await Notice.create({
    title: title.trim(),
    content: content.trim(),
    targetType,
    targetId: targetType === "platform" ? null : targetId,
    noticeType: noticeType || "announcement",
    priority: priority || "normal",
    metadata: metadata || {},
    expiresAt: expiresAt || null,
    attachments: attachments || [],
    createdBy: req.user._id,
  });

  await notice.populate("createdBy", "firstName lastName role");
  sendResponse(res, 201, "Notice posted.", notice);
});

export const getNotices = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.query;
  const user = req.user;

  // Base persistent query layer
  const query = { isArchived: false };

  if (targetType === "dashboard") {
    if (!user) {
      throw new ApiError(401, "Authentication required for dashboard feed.");
    }

    // Step A: Aggregate Career Drive boundaries
    const studentApplications = await Application.find({ student: user._id })
      .select("drive")
      .lean();
    const appliedDriveIds = studentApplications.map((app) => app.drive);

    const eligibleDrives = await Drive.find({
      $or: [
        { _id: { $in: appliedDriveIds } },
        {
          eligibleBranches: user.branch,
          minCGPA: { $lte: user.cgpa || 0 },
          minYear: { $lte: user.year || 1 },
          maxYear: { $gte: user.year || 4 },
        },
      ],
    })
      .select("_id")
      .lean();

    const driveIds = eligibleDrives.map((d) => d._id);
    const clubIds = [
      ...(user.followedClubs || []),
      ...(user.joinedClubs || []),
    ];
    const registeredEventIds = user.registeredEvents || [];

    // Step B: Match across all authorized student lifecycles
    query.$or = [
      { targetType: "platform" },
      { targetType: "classroom", targetId: user.classroom },
      { targetType: "drive", targetId: { $in: driveIds } },
      { targetType: "clubs", targetId: { $in: clubIds } },
      { targetType: "events", targetId: { $in: registeredEventIds } },
    ];

    // ─── 2. DYNAMIC COMMUNITY FEED INTERCEPTION ───────────────────
  } else if (targetType === "community") {
    if (!user) {
      throw new ApiError(401, "Authentication required for community feed.");
    }

    const clubIds = [
      ...(user.followedClubs || []),
      ...(user.joinedClubs || []),
    ];
    const registeredEventIds = user.registeredEvents || [];

    query.$or = [
      { targetType: "clubs", targetId: { $in: clubIds } },
      { targetType: "events", targetId: { $in: registeredEventIds } },
    ];

    // ─── 3. DYNAMIC CAREER FEED INTERCEPTION ──────────────────────
  } else if (targetType === "career") {
    if (!user) {
      throw new ApiError(401, "Authentication required for career feed.");
    }

    const studentApplications = await Application.find({ student: user._id })
      .select("drive")
      .lean();
    const appliedDriveIds = studentApplications.map((app) => app.drive);

    const eligibleDrives = await Drive.find({
      $or: [
        { _id: { $in: appliedDriveIds } },
        {
          eligibleBranches: user.branch,
          minCGPA: { $lte: user.cgpa || 0 },
          minYear: { $lte: user.year || 1 },
          maxYear: { $gte: user.year || 4 },
        },
      ],
    })
      .select("_id")
      .lean();

    const driveIds = eligibleDrives.map((drive) => drive._id);
    query.targetType = { $in: ["drive", "drives"] };
    query.targetId = { $in: driveIds };

    // ─── 4. DIRECT TARGET SPECIFIC LOOKUPS ────────────────────────
  } else {
    if (targetType) query.targetType = targetType;

    if (targetId && targetId !== "null" && targetId !== "undefined") {
      if (mongoose.Types.ObjectId.isValid(targetId)) {
        query.targetId = new mongoose.Types.ObjectId(targetId);
      } else {
        query.targetId = targetId;
      }
    }
  }

  // ─── 5. UNEXPIRED DATES RULE GROUP ISOLATION ──────────────────
  query.$and = [
    {
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    },
  ];

  // ─── 6. EXECUTE FETCH PIPELINE ────────────────────────────────
  let notices = await Notice.find(query)
    .populate("createdBy", "firstName lastName role")
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(15)
    .lean();

  // ─── 7. DYNAMIC REF POPULATORS ────────────────────────────────
  if (notices.length > 0) {
    const clubsNotices = notices.filter((n) => n.targetType === "clubs");
    const eventsNotices = notices.filter((n) => n.targetType === "events");
    const driveNotices = notices.filter(
      (n) => n.targetType === "drive" || n.targetType === "drives",
    );

    if (clubsNotices.length > 0) {
      await Notice.populate(clubsNotices, {
        path: "targetId",
        model: "Club",
        select: "clubName logo",
      });
    }
    if (eventsNotices.length > 0) {
      await Notice.populate(eventsNotices, {
        path: "targetId",
        model: "Event",
        select: "eventName",
      });
    }
    if (driveNotices.length > 0) {
      await Notice.populate(driveNotices, {
        path: "targetId",
        model: "Drive",
        select: "companyName role",
      });
    }
  }

  // ─── 8. PRIORITIZATION SORTING & SLICING ──────────────────────
  const priorityWeights = { urgent: 3, high: 2, normal: 1, low: 0 };
  notices.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
    return (
      (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0)
    );
  });

  // Keep final presentation compact and fast
  const finalFeed = notices.slice(0, 5);

  return sendResponse(res, 200, "Notices fetched safely.", {
    notices: finalFeed,
  });
});
// ─── GET /api/notices/:id ─────────────────────────────────────────────────────
export const getNoticeById = asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true },
  ).populate("createdBy", "firstName lastName role");

  if (!notice) {
    return res
      .status(404)
      .json({ success: false, message: "Notice not found." });
  }

  sendResponse(res, 200, "Notice fetched.", notice);
});

// ─── DELETE /api/notices/:id ──────────────────────────────────────────────────
export const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice)
    return res.status(404).json({ success: false, message: "Not found." });

  const isOwner = notice.createdBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Not authorised." });
  }

  await notice.deleteOne();
  sendResponse(res, 200, "Notice deleted.");
});

// ─── PATCH /api/notices/:id/pin  (toggle) ────────────────────────────────────
export const togglePin = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice)
    return res.status(404).json({ success: false, message: "Not found." });

  notice.isPinned = !notice.isPinned;
  await notice.save();
  sendResponse(
    res,
    200,
    notice.isPinned ? "Notice pinned." : "Notice unpinned.",
    {
      isPinned: notice.isPinned,
    },
  );
});

// ─── PATCH /api/notices/:id/archive ──────────────────────────────────────────
export const archiveNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice)
    return res.status(404).json({ success: false, message: "Not found." });

  const isOwner = notice.createdBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Not authorised." });
  }

  notice.isArchived = true;
  await notice.save();
  sendResponse(res, 200, "Notice archived.");
});
