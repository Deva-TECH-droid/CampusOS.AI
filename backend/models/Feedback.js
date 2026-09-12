import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    userName: {
      type: String,
      default: "Anonymous User",
    },
    userEmail: {
      type: String,
      default: "",
    },
    userRole: {
      type: String,
      default: "student",
    },
    rating: {
      type: Number,
      required: [true, "Rating between 1 and 5 is required"],
      min: 1,
      max: 5,
    },
    message: {
      type: String,
      required: [true, "Feedback message is required"],
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ["Campus Assistant", "General Experience", "Academics", "Attendance", "Portal UI"],
      default: "Campus Assistant",
    },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
