import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    startDateTime: {
      type: Date,
      required: true,
    },

    endDateTime: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
    },
    banner: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    organizerClub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: [true, "Organizer club is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventOrganizers:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ]
      
    ,
    registeredStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    eligibleBranches: {
      type: [String],
      default: [], // empty array means open to all branches
    },
    eligibleYears: {
      type: [Number],
      default: [], // empty array means open to all years
    },
    status: {
      type: String,
      enum: ["Cancelled"],
    },
  },
  { timestamps: true },
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
