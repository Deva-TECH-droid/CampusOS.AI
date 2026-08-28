// event controller
import Event from "../models/Event.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import ApiError from "../utils/apiError.js";
// TODO: implement controller function
export const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({
    ...req.body,
    createdBy: req.user._id,
  });

  sendResponse(res, 201, "Event created successfully", event);
});

export const getAllEvents = asyncHandler(async (req, res) => {
  const events = await Event.find();
  sendResponse(res, 200, "Events fetched Successfully", events);
});

export const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate("organizerClub", "clubName logo")
    .populate("createdBy", "firstName secondName");
    const isOrganizer=event.eventOrganizers.some(organizer=> organizer.equals(req.user._id));
  sendResponse(res, 200, "Events fetched Successfully",{
    event,
    isOrganizer
  } );
});

export const registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  const user=await User.findById(req.user._id);

  if (!event) {
    throw new ApiError(404, "Event not found");
  }
  if (
    event.eligibleBranches?.length > 0 &&
    !event.eligibleBranches.includes(req.user.branch)
  ) {
    throw new ApiError(403, "Your branch is not eligible for this event");
  }
  if (
    event.eligibleYears?.length > 0 &&
    !event.eligibleYears.includes(req.user.year)
  ) {
    throw new ApiError(403, "Your year is not eligible for this event");
  }
  const alreadyRegistered = event.registeredStudents.some(
    (student) => student.toString() === req.user._id.toString(),
  );

  if (alreadyRegistered) {
    throw new ApiError(400, "Already registered");
  }
  event.registeredStudents.push(req.user._id);
  user.registeredEvents.push(req.params.id);

  await user.save();
  await event.save();
  sendResponse(res, 201, "Registered Successfully", {user,event});
});

export const getUpcomingEvents = asyncHandler(async (req, res) => {
  const now = new Date();

  const events = await Event.find({
    // Keeps events that are either currently running or haven't started yet
    endDateTime: { $gte: now },
  })
    .populate("organizerClub", "clubName logo")
    .sort({ startDateTime: 1 }) // Keeps the closest events at the top
    .limit(5);

  sendResponse(res, 200, "Upcoming and ongoing events fetched", events);
});

export const registeredEvents=asyncHandler(async(req,res)=>{
  const events= await User.find(req.user._id);
})

export const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params; 
  const updates = req.body;
  

  if (!id || id === "undefined") {
    return sendResponse(res, 400, "Invalid or missing Event ID parameter");
  }

  if (updates.startDateTime && updates.endDateTime) {
    if (new Date(updates.endDateTime) <= new Date(updates.startDateTime)) {
      return sendResponse(res, 400, "End date and time must be after the start timeline");
    }
  }

  const updatedEvent = await Event.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true } // Returns the newly modified object and fires schema validations
  );
  

  if (!updatedEvent) {
    return sendResponse(res, 404, "Target event configuration does not exist");
  }

  return sendResponse(res, 200, "Event parameters synced successfully", { event: updatedEvent });
});