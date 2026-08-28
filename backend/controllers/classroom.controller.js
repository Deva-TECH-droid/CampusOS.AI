// resource controller

import Classroom from "../models/Classroom.js";
import Deadline from "../models/Deadline.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";

// TODO: implement controller functions
export const getClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.user.classroom);

  if (!classroom) {
    return res
      .status(404)
      .json({ success: false, message: "Classroom context not found." });
  }

  // Defensively convert to string variables to evaluate matching states safely
  const repIdStr = classroom.classRepresentative?.toString();
  const userIdStr = req.user._id?.toString();

  // Compute validation boolean flag state
  const isClassRep =
    req.user.role === "superadmin" ||
    (repIdStr !== undefined && repIdStr === userIdStr);

  return sendResponse(res, 200, "Classroom fetched successfully", {
    classroom,
    isClassRep, // Returns clean explicitly typed true/false boolean primitive
  });
});

export const upsertDeadline = asyncHandler(async (req, res) => {
  const { classroomId, deadlineId } = req.params;
  const { title, description, type, dueDate } = req.body;

  if (deadlineId) {
    const updatedDeadline = await Deadline.findOneAndUpdate(
      { _id: deadlineId },
      {
        title,
        description,
        type,
        dueDate,
        classroom: classroomId,
        postedBy: req.user._id,
      },
      { new: true, runValidators: true },
    );
    if (!updatedDeadline) {
      return res.status(404).json({ message: "Deadline not found." });
    }
    return sendResponse(
      res,
      200,
      "deadline updated successfully",
      updatedDeadline,
    );
  }

  const newDeadline = await Deadline.create({
    ...req.body,
    postedBy: req.user._id,
    classroom: classroomId,
  });
  sendResponse(res, 201, "deadline created successfully", newDeadline);
});

export const getDeadlines = asyncHandler(async (req, res) => {
  const data = await Deadline.find({
    classroom: req.params.id,
  });
  sendResponse(res, 200, "deadlines fetched", data);
});

export const deletDeadline = asyncHandler(async (req, res) => {
  const data = await Deadline.findByIdAndDelete(req.params.deadlineId);
  if (!data) sendResponse(res, 404, "deadline doesnt exist");
  sendResponse(res, 200, "deadline deleted", data);
});
