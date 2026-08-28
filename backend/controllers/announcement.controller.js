// announcement controller

import asyncHandler from "../utils/asyncHandler.js";
import Club from "../models/Club.js";
import Event from "../models/Event.js";
import { Announcement } from "../models/Announcement.js";
import sendResponse from "../utils/sendResponse.js";
import ApiError from "../utils/apiError.js";
// TODO: implement controller functions
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.params;
  const { title, body, image } = req.body;

  if (!targetType) {
    throw new ApiError(400, "Invalid target type");
  }

  const announcementData = {
    title,
    body,
    image,
    postedBy: req.user._id,
    targetType: targetType,
  };

  if (targetType === "club") {
    announcementData.club = targetId;
  }

  if (targetType === "event") {
    announcementData.event = targetId;
  }

  const announcement = await Announcement.create(announcementData);

  sendResponse(res, 201, "announcement created", announcement);
});

export const getAnnouncements = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.params;

  let data;

  if (targetType === "club") {
    data = await Announcement.find({
      targetType: "club",
      club: targetId,
    })
      .populate("postedBy", "firstName lastName")
      .sort({ createdAt: -1 });
  } else if (targetType === "event") {
    data = await Announcement.find({
      targetType: "event",
      event: targetId,
    })
      .populate("postedBy", "firstName lastName")
      .sort({ createdAt: -1 });
  } else {
    throw new ApiError(400, "Invalid target type");
  }

  sendResponse(res, 200, "Announcements fetched successfully", data);
});

export const getCommunityFeed = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Parse individual category page cursors/offsets
  const eventOffset = Number(req.query.eventOffset) || 0;
  const clubOffset = Number(req.query.clubOffset) || 0;
  const generalOffset = Number(req.query.generalOffset) || 0;

  // 2. Resolve Targeted Entity Relationship Lists
  const [followedClubs, registeredEvents] = await Promise.all([
    Club.find({ clubFollowers: userId }).select("_id").lean(),
    Event.find({ registeredStudents: userId }).select("_id").lean(),
  ]);

  const followedClubIds = followedClubs.map((c) => c._id);
  const registeredEventIds = registeredEvents.map((e) => e._id);

  // 3. Define the Core Matching Criteria Filters
  const eventFilter = {
    targetType: "event",
    event: { $in: registeredEventIds },
  };
  const clubFilter = { targetType: "club", club: { $in: followedClubIds } };

  //  Club announcements NOT followed AND Event announcements NOT registered for
  const generalFilter = {
    $or: [
      { targetType: "club", club: { $nin: followedClubIds } },
      { targetType: "event", event: { $nin: registeredEventIds } },
    ],
  };

  // 4. Define target consumption baseline quotas
  let targetEvent = 8;
  let targetClub = 8;
  let targetGeneral = 4;
  const totalDesired = 20;

  // ── PHASE A: Initial Quota Count Evaluation ──
  const [availEvent, availClub, availGeneral] = await Promise.all([
    Announcement.countDocuments(eventFilter),
    Announcement.countDocuments(clubFilter),
    Announcement.countDocuments(generalFilter),
  ]);

  const remainingEvent = Math.max(0, availEvent - eventOffset);
  const remainingClub = Math.max(0, availClub - clubOffset);
  const remainingGeneral = Math.max(0, availGeneral - generalOffset);

  // ── PHASE B: Adaptive Dynamic Deficit Reallocation ──
  targetEvent = Math.min(targetEvent, remainingEvent);
  targetClub = Math.min(targetClub, remainingClub);
  targetGeneral = Math.min(targetGeneral, remainingGeneral);

  let currentTotal = targetEvent + targetClub + targetGeneral;

  if (currentTotal < totalDesired) {
    let loopProtect = 0;
    while (
      currentTotal < totalDesired &&
      (targetEvent < remainingEvent ||
        targetClub < remainingClub ||
        targetGeneral < remainingGeneral)
    ) {
      if (loopProtect++ > 20) break;

      if (targetEvent < remainingEvent && currentTotal < totalDesired) {
        targetEvent++;
        currentTotal++;
      }
      if (targetClub < remainingClub && currentTotal < totalDesired) {
        targetClub++;
        currentTotal++;
      }
      if (targetGeneral < remainingGeneral && currentTotal < totalDesired) {
        targetGeneral++;
        currentTotal++;
      }
    }
  }

  // ── PHASE C: Query Database via Isolated Offsets ──
  const [eventItems, clubItems, generalItems] = await Promise.all([
    targetEvent > 0
      ? Announcement.find(eventFilter)
          .populate("event", "eventName bannerUrl image")
          .populate("postedBy", "firstName lastName profilePicture")
          .sort({ createdAt: -1 })
          .skip(eventOffset)
          .limit(targetEvent)
          .lean()
      : [],

    targetClub > 0
      ? Announcement.find(clubFilter)
          .populate("club", "clubName logo")
          .populate("postedBy", "firstName lastName profilePicture")
          .sort({ createdAt: -1 })
          .skip(clubOffset)
          .limit(targetClub)
          .lean()
      : [],

    targetGeneral > 0
      ? Announcement.find(generalFilter)
          .populate("club", "clubName logo")
          .populate("event", "eventName bannerUrl image")
          .populate("postedBy", "firstName lastName profilePicture")
          .sort({ createdAt: -1 })
          .skip(generalOffset)
          .limit(targetGeneral)
          .lean()
      : [],
  ]);

  // ── PHASE D: Clean Deleted Entity Anomalies ──
  const cleanEvents = eventItems.filter((item) => item.event);
  const cleanClubs = clubItems.filter((item) => item.club);
  const cleanGenerals = generalItems.filter((item) => {
    if (item.targetType === "club" && !item.club) return false;
    if (item.targetType === "event" && !item.event) return false;
    return true;
  });

  // ── PHASE E: Uniform Interleaving Zipping Routine ──
  const interleavedFeed = [];
  const maxIterations = Math.max(
    cleanEvents.length,
    cleanClubs.length,
    cleanGenerals.length,
  );

  for (let i = 0; i < maxIterations; i++) {
    if (i < cleanEvents.length) interleavedFeed.push(cleanEvents[i]);
    if (i < cleanClubs.length) interleavedFeed.push(cleanClubs[i]);
    if (i < cleanGenerals.length) interleavedFeed.push(cleanGenerals[i]);
  }

  // Calculate new tracking cursor points
  const nextEventOffset = eventOffset + targetEvent;
  const nextClubOffset = clubOffset + targetClub;
  const nextGeneralOffset = generalOffset + targetGeneral;

  const hasMore =
    nextEventOffset < availEvent ||
    nextClubOffset < availClub ||
    nextGeneralOffset < availGeneral;

  return sendResponse(res, 200, "Community feed synchronized successfully.", {
    feed: interleavedFeed,
    hasMore,
    offsets: {
      eventOffset: nextEventOffset,
      clubOffset: nextClubOffset,
      generalOffset: nextGeneralOffset,
    },
  });
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user; // Populated by your authentication middleware

  if (!id || id === "undefined") {
    return sendResponse(res, 400, "Invalid or missing ID parameter");
  }

  // 1. Fetch the announcement to check context properties
  const announcement = await Announcement.findById(id);
  if (!announcement) {
    return sendResponse(res, 404, "Announcement does not exist");
  }

  // 2. Base Authorization Checks (Superadmin or Creator)
  const isSuperAdmin = user.role === "superadmin";
  const isAuthor = announcement.postedBy.toString() === user._id.toString();

  let isAuthorizedManager = false;

  // 3. Contextual Authority Check (Club Admin array check)
  if (announcement.targetType === "club" && announcement.club) {
    const club = await Club.findById(announcement.club);
    if (club && club.clubAdmin) {
      isAuthorizedManager = club.clubAdmin.some(
        (adminId) => adminId.toString() === user._id.toString(),
      );
    }
  }

  // 4. Contextual Authority Check (Event Organizers array check)
  if (announcement.targetType === "event" && announcement.event) {
    const event = await Event.findById(announcement.event);
    if (event && event.eventOrganizers) {
      isAuthorizedManager = event.eventOrganizers.some(
        (organizerId) => organizerId.toString() === user._id.toString(),
      );
    }
  }

  // 5. Enforce final gatekeeping block
  if (!isSuperAdmin && !isAuthor && !isAuthorizedManager) {
    return sendResponse(
      res,
      403,
      "Forbidden: You are not authorized to delete this announcement",
    );
  }

  // 6. Execution Block
  await announcement.deleteOne();

  return sendResponse(res, 200, "Deleted successfully", announcement);
});
