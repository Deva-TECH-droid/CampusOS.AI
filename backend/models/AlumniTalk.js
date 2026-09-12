import mongoose from "mongoose";

const alumniTalkSchema = new mongoose.Schema(
  {
    speaker: {
      type: String,
      required: [true, "Speaker name is required"],
      trim: true,
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company is required"],
      trim: true,
    },
    date: {
      type: String,
      required: [true, "Date is required"], // e.g. "20 September 2026"
    },
    time: {
      type: String,
      required: [true, "Time is required"], // e.g. "2:00 PM"
    },
    venue: {
      type: String,
      default: "Auditorium / Virtual Meet",
    },
    meetingUrl: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    banner: {
      type: String,
      default: "",
    },
    speakerBio: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    registeredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
      default: "Upcoming",
    },
  },
  { timestamps: true }
);

const AlumniTalk = mongoose.model("AlumniTalk", alumniTalkSchema);
export default AlumniTalk;
