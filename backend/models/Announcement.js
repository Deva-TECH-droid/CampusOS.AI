import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    body: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    targetType: {
      type: String,
      enum: ["club", "event"],
      required: true,
    },

    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.pre("validate", function (next) {
  if (this.targetType === "club") {
    if (!this.club) {
      return next(new Error("Club announcement must have a club"));
    }

    this.event = null;
  }

  if (this.targetType === "event") {
    if (!this.event) {
      return next(new Error("Event announcement must have an event"));
    }

    this.club = null;
  }

  next();
});

export const Announcement = mongoose.model(
  "Announcement",
  announcementSchema
);