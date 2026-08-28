import mongoose from "mongoose";

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    textAnswer: { type: String, default: "" },
    fileUrl: { type: String, default: "" },

    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },

    marks: { type: Number, default: null },
    feedback: { type: String, default: "" },
    gradedAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ["submitted", "graded"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

// One submission per student per assignment (resubmitting overwrites it).
assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);
