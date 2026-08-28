import Club from "../models/Club.js";
import Event from "../models/Event.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import { Announcement } from "../models/Announcement.js";
import User from "../models/User.js";

export const getAllClubs = asyncHandler(async (req, res) => {
  const data = await Club.find();
  sendResponse(res, 200, "Clubs fetched successfully", data);
});

export const getClubDetails = asyncHandler(async (req, res) => {
  const clubId = req.params.clubId;
  const club = await Club.findById(clubId);
  if (!club) {
    return sendResponse(res, 404, "Club not found");
  }
  const isAdmin =
    club.clubAdmins.includes(req.user._id) || req.user.role === "superadmin";

  const events = await Event.find({
    organizerClub: clubId,
  })
    .sort({ date: 1 })
    .limit(5);

  const announcements = await Announcement.find({
    targetType: "club",
    club: clubId,
  })
    .populate("postedBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .limit(3);

  sendResponse(res, 200, "Club fetched Successfully", {
    club,
    events,
    announcements,
    isAdmin,
  });
});

export const followClub = asyncHandler(async (req, res) => {
  const clubId = req.params.clubId;

  const club = await Club.findById(clubId);
  const user = await User.findById(req.user._id);

  if (!club) throw new ApiError(400, "Club not found");

  const alreadyFollowing =
    club.clubFollowers.some(
      (follower) => follower.toString() === req.user._id.toString(),
    ) ||
    user.followedClubs.some(
      (followedClub) => followedClub.toString() === clubId.toString(),
    );

  if (alreadyFollowing) {
    club.clubFollowers = club.clubFollowers.filter(
      (follower) => follower.toString() !== req.user._id.toString(),
    );
    user.followedClubs = user.followedClubs.filter(
      (followedClub) => followedClub.toString() !== clubId.toString(),
    );

    await club.save();
    await user.save();

    return sendResponse(res, 200, "Club unfollowed", {
      club,
      user,
      isFollowing: false,
    });
  }

  club.clubFollowers.push(req.user._id);
  user.followedClubs.push(clubId);

  await user.save();
  await club.save();

  sendResponse(res, 200, "Club followed", {
    club,
    user,
    isFollowing: true,
  });
});

export const getPopularClubs = asyncHandler(async (req, res) => {
  const clubs = await Club.find();

  clubs.sort((a, b) => b.clubFollowers.length - a.clubFollowers.length);

  sendResponse(res, 200, "Popular clubs fetched", clubs.slice(0, 5));
});

export const updateClub = async (req, res) => {
  const { clubId } = req.params;
  const { clubName, description, category, logo, banner, isActive, adminIds } =
    req.body;

  const currentUser = req.user; // Appended by your authentication verifyJWT middleware

  // 1. Fetch target club record with existing admins pre-populated
  const club = await Club.findById(clubId);
  if (!club) {
    throw new ApiError(404, "Target club resource could not be found.");
  }

  // 2. Role-Based Access Control (RBAC) Guard Verification
  const isSuperAdmin = currentUser.role === "superadmin";
  const isClubAdmin = club.clubAdmins.some(
    (adminId) => adminId.toString() === currentUser._id.toString(),
  );

  if (!isSuperAdmin && !isClubAdmin) {
    throw new ApiError(
      403,
      "Access Denied: You do not have permissions to modify this club.",
    );
  }

  // 3. Build Safe Modification Updates Sandbox Object
  const updates = {};

  if (clubName !== undefined) updates.clubName = clubName.trim();
  if (description !== undefined) updates.description = description.trim();
  if (category !== undefined) updates.category = category;

  // Handle empty string or explicit null assignments for Cloudinary media pointers
  if (logo !== undefined) updates.logo = logo?.trim() || null;
  if (banner !== undefined) updates.banner = banner?.trim() || null;

  // 4. Structural Security Restriction Overrides
  // ONLY Super Admins can alter a club's active state or swap structural admin permissions
  if (isSuperAdmin) {
    if (isActive !== undefined) updates.isActive = isActive;
  } else {
    // If a regular Club Admin tries to pass these fields, silently ignore them or throw an explicit rejection
    if (isActive !== undefined && isActive !== club.isActive) {
      throw new ApiError(
        403,
        "Privilege Escalation Blocked: Only Super Admins can alter application activation visibility status.",
      );
    }
  }

  // 5. Execute Atomic Database Updates Mutation
  const updatedClub = await Club.findByIdAndUpdate(
    clubId,
    { $set: updates },
    {
      new: true, // Returns the freshly updated document configuration item map
      runValidators: true, // Enforces your Mongoose schema layout safety checks
    },
  );

  sendResponse(
    res,
    200,
    "Club properties committed and synchronized successfully.",
    updatedClub,
  );
};
