import Club from "../models/Club.js";
import asyncHandler from "../utils/asyncHandler.js";

// Expects clubId in req.params.clubId or req.body.clubId
const clubAdminMiddleware = asyncHandler(async (req, res, next) => {
  const clubId = req.params.clubId || req.body.clubId;

  if (!clubId) {
    return res.status(400).json({ success: false, message: "Club ID is required." });
  }

  const club = await Club.findById(clubId);

  if (!club) {
    return res.status(404).json({ success: false, message: "Club not found." });
  }

  if (!club.isActive) {
    return res.status(403).json({ success: false, message: "Club is not active." });
  }

  const isAdmin = club.clubAdmins.some(
    (adminId) => adminId.toString() === req.user._id.toString()
  );

  // Super Admin always passes through
  if (!isAdmin && req.user.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. You are not an admin of this club.",
    });
  }

  req.club = club; // attach club to request so controller doesn't re-fetch
  next();
});

export default clubAdminMiddleware;