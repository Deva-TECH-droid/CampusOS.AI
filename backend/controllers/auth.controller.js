//https://claude.ai/share/08aaa4ce-0935-4702-a5f2-e95e00ef8a64 authentication chat link

import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import {
  registerUser,
  registerFaculty,
  loginUser,
  refreshAccessToken,
  logoutUser,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  getProfileData
} from "../services/auth.service.js";
import User from "../models/User.js";

export const signup = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);

  sendResponse(res, 201, "Account created. A teacher needs to approve your request before you can access classes.", {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    branch: user.branch,
    year: user.year,
    section: user.section,
    rollNumber: user.rollNumber,
  });
});

export const signupTeacher = asyncHandler(async (req, res) => {
  const faculty = await registerFaculty(req.body);

  sendResponse(res, 201, "Account created. An admin needs to approve you before you can access the Teacher Portal.", {
    _id: faculty._id,
    firstName: faculty.firstName,
    lastName: faculty.lastName,
    email: faculty.email,
    role: faculty.role,
    status: faculty.status,
    department: faculty.department,
    employeeId: faculty.employeeId,
    requestedSubjects: faculty.requestedSubjects,
  });
});

// ── GET /api/auth/teachers-directory ──────────────────────────────────
// Public: lists approved teachers and the subjects they're actually
// wired to teach, so a student signing up can pick "Ram Sir — Python".
export const getTeachersDirectory = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: "faculty", status: "approved" })
    .select("firstName lastName facultyAssignments")
    .populate("facultyAssignments.classroom", "className")
    .lean();

  const directory = teachers.flatMap((t) =>
    (t.facultyAssignments || []).map((a) => ({
      facultyId: t._id,
      facultyName: `${t.firstName} ${t.lastName}`,
      subject: a.subject,
      className: a.classroom?.className,
    }))
  );

  sendResponse(res, 200, "Teachers fetched.", { directory });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required." });
  }

  const { user, accessToken, refreshToken } = await loginUser(email, password);

  res
    .cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS)
    .cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

  sendResponse(res, 200, "Login successful.", {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    branch: user.branch,
    year: user.year,
    section: user.section,
    rollNumber: user.rollNumber,
    cgpa: user.cgpa,
    followedClubs: user.followedClubs,
    registeredEvents: user.registeredEvents,
    classroom:user.classroom,
    profilePicture: user.profilePicture,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  const { newAccessToken, newRefreshToken } =
    await refreshAccessToken(incomingRefreshToken);

  res
    .cookie("accessToken", newAccessToken, ACCESS_COOKIE_OPTIONS)
    .cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS);

  sendResponse(res, 200, "Token refreshed.");
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.user._id);

  res.clearCookie("accessToken").clearCookie("refreshToken");

  sendResponse(res, 200, "Logged out successfully.");
});

export const getMe = asyncHandler(async (req, res) => {
  sendResponse(res, 200, "User fetched.", req.user);
});

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await getProfileData(req.user._id);

  sendResponse(
    res,
    200,
    "Profile fetched successfully",
    profile
  );
});

const isValidUrl = (string) => {
  if (!string) return true; // Optional fields can be empty strings
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export const updateProfile = asyncHandler(async (req, res) => {
  // 1. Identify the logged-in user from the authentication middleware
  const userId = req.user?._id; 
  
  if (!userId) {
    return sendResponse(res, 401, "Unauthorized: User session not found");
  }

  // 2. Extract allowed fields from body to prevent malicious parameter injection
  const {
    firstName,
    lastName,
    profilePicture,
    bio,
    github,
    linkedin,
    portfolio,
    resumeUrl,
  } = req.body;

  // 3. Mandatory field validation
  if (firstName !== undefined && !firstName.trim()) {
    return sendResponse(res, 400, "First name cannot be empty");
  }

  // 4. URL format validation checks for assets and social configurations
  if (github && !isValidUrl(github)) return sendResponse(res, 400, "Invalid GitHub URL format");
  if (linkedin && !isValidUrl(linkedin)) return sendResponse(res, 400, "Invalid LinkedIn URL format");
  if (portfolio && !isValidUrl(portfolio)) return sendResponse(res, 400, "Invalid Portfolio URL format");
  if (resumeUrl && !isValidUrl(resumeUrl)) return sendResponse(res, 400, "Invalid Resume asset URL format");
   if (profilePicture && !isValidUrl(profilePicture)) return sendResponse(res, 400, "Invalid rpofile picture URL format");

  // 5. Construct update object dynamically based on what was passed
 // ─── Safely Construct Update Object ──────────────────────────
  const updateData = {};
  
  if (firstName !== undefined) updateData.firstName = firstName.trim();
  if (lastName !== undefined) updateData.lastName = lastName.trim();
  if (bio !== undefined) updateData.bio = bio.trim();

  // Protect optional social values by checking if they exist before trimming
  if (profilePicture !== undefined) updateData.profilePicture = profilePicture.trim();
  if (github !== undefined) updateData.github = github ? github.trim() : "";
  if (linkedin !== undefined) updateData.linkedin = linkedin ? linkedin.trim() : "";
  if (portfolio !== undefined) updateData.portfolio = portfolio ? portfolio.trim() : "";
  if (resumeUrl !== undefined) updateData.resumeUrl = resumeUrl ? resumeUrl.trim() : "";

  // 6. Execute update query against database
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { 
      new: true,           // Returns the modified document rather than the old one
      runValidators: true, // Forces Mongoose schema validators to re-fire on updates
      select: "-password"  // Ensures the hashed password remains private
    }
  );

  if (!updatedUser) {
    return sendResponse(res, 404, "User profile record does not exist");
  }

  // 7. Success: Send fresh payload back up to frontend profile state
  return sendResponse(res, 200, "Profile updated successfully", updatedUser);
});
