import User from "../models/User.js";
import mongoose from "mongoose";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import Classroom from "../models/Classroom.js"
import Discussion from "../models/Discussion.js";
import Application from "../models/Application.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

const ACCESS_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const registerUser = async (userData) => {
  const {
    firstName, lastName, email, password,
    branch, year, section, rollNumber, cgpa,
    requestedFacultyId, requestedSubject,
  } = userData;

  const existingUser = await User.findOne({ $or: [{ email }, { rollNumber }] });
  if (existingUser) {
    const field = existingUser.email === email ? "Email" : "Roll number";
    const error = new Error(`${field} already registered.`);
    error.statusCode = 409;
    throw error;
  }

  // Every new student starts pending — they're only fully approved once
  // the teacher they requested confirms them (see faculty.controller.js
  // approveStudent). If they didn't pick a teacher, they still land as
  // pending; an admin can sort them out from the Faculty/Attendance panel.
  let pendingRequest = { faculty: null, subject: null };
  if (requestedFacultyId && requestedSubject) {
    const faculty = await User.findOne({
      _id: requestedFacultyId,
      role: "faculty",
      status: "approved",
    });
    if (!faculty) {
      const error = new Error("That teacher couldn't be found or isn't approved yet.");
      error.statusCode = 400;
      throw error;
    }
    pendingRequest = { faculty: faculty._id, subject: requestedSubject };
  }

  const user = await User.create({
    firstName, lastName, email, password,
    branch, year, section, rollNumber,
    cgpa: cgpa || 0,
    status: "pending",
    pendingRequest,
  });

  return user;
};

export const registerFaculty = async (facultyData) => {
  const { firstName, lastName, email, password, department, employeeId, subjects } = facultyData;

  const existingUser = await User.findOne({
    $or: [{ email }, ...(employeeId ? [{ employeeId }] : [])],
  });
  if (existingUser) {
    const field = existingUser.email === email ? "Email" : "Employee ID";
    const error = new Error(`${field} already registered.`);
    error.statusCode = 409;
    throw error;
  }

  const faculty = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: "faculty",
    status: "pending",
    department,
    employeeId,
    requestedSubjects: Array.isArray(subjects) ? subjects.filter(Boolean) : [],
    // Faculty don't have these student-specific fields, but the schema
    // requires them — fill with harmless placeholders, same pattern
    // already used for admin-created faculty accounts.
    branch: department || "Faculty",
    year: 1,
    section: "-",
    rollNumber: `FAC-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`,
  });

  return faculty;
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password +refreshToken");//Doesn't return password and refreshtoken by default so we have to do that

  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Strip sensitive fields before returning
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return { user: userObj, accessToken, refreshToken };
};

export const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    const error = new Error("No refresh token.");
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    const jwt = await import("jsonwebtoken");
    decoded = jwt.default.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    const error = new Error("Invalid or expired refresh token.");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.refreshToken !== incomingRefreshToken) {
    const error = new Error("Refresh token reuse detected or user not found.");
    error.statusCode = 401;
    throw error;
  }

  // Rotate: issue new pair
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return { newAccessToken, newRefreshToken };
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

export const getProfileData = async (userId) => {
  // Fetch user first (needed for classroom & populated arrays)
  const user = await User.findById(userId)
    .select(
      "firstName lastName email rollNumber branch year section cgpa role profilePicture createdAt classroom followedClubs registeredEvents"
    )
    .populate("followedClubs", "clubName logo")
    .populate("registeredEvents", "eventName venue startDateTime")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Run independent queries in parallel
  const [
    classroom,
    discussionsCreated,
    placementApplications,
    recentApplications,
  ] = await Promise.all([
    user.classroom
      ? Classroom.findById(user.classroom)
          .select("className")
          .lean()
      : null,

    Discussion.countDocuments({ author: userId }),

    Application.countDocuments({ student: userId }),

    Application.find({ student: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("drive", "companyName role status deadline")
      .lean(),
  ]);

  return {
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      rollNumber: user.rollNumber,
      branch: user.branch,
      year: user.year,
      section: user.section,
      cgpa: user.cgpa,
      role: user.role,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
    },

    stats: {
      clubsFollowing: user.followedClubs.length,
      eventsRegistered: user.registeredEvents.length,
      discussionsCreated,
      placementApplications,
    },

    classroom,

    followedClubs: user.followedClubs,

    registeredEvents: user.registeredEvents,

    recentApplications,
  };
};

export { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS };