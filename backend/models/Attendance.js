import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    faculty: {
      type: String,
      default: "",
    },

    // Calendar date the class period took place on (midnight, local) —
    // used together with `subject` to prevent double check-ins.
    date: {
      type: Date,
      required: true,
    },

    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },

    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    status: {
      type: String,
      enum: ["present", "absent"],
      default: "present",
    },

    method: {
      type: String,
      enum: ["face", "manual"],
      default: "face",
    },

    // Euclidean distance between the live capture and the enrolled
    // descriptor at the moment of marking — lower is a stronger match.
    matchConfidence: {
      type: Number,
      default: null,
    },

    markedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// A student can only have one attendance record per subject-period per day
attendanceSchema.index(
  { student: 1, subject: 1, date: 1, startTime: 1 },
  { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);
