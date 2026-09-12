import mongoose from "mongoose";

const facultyAttendanceSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    facultyName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true, // e.g. "07:55 AM"
    },
    status: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Present",
    },
    method: {
      type: String,
      enum: ["face", "manual"],
      default: "face",
    },
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

// Prevent duplicate attendance for the same faculty on the same day
facultyAttendanceSchema.index({ faculty: 1, date: 1 }, { unique: true });

const FacultyAttendance = mongoose.model("FacultyAttendance", facultyAttendanceSchema);
export default FacultyAttendance;
