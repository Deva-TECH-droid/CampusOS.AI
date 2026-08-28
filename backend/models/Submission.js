import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOptionIndex: { type: Number, default: null }, // mcq
    textAnswer: { type: String, default: "" }, // subjective

    // Filled in at grading time
    awardedMarks: { type: Number, default: null },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    answers: { type: [answerSchema], default: [] },

    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },

    autoScore: { type: Number, default: 0 }, // sum of MCQ marks
    manualScore: { type: Number, default: 0 }, // sum of graded subjective marks
    finalScore: { type: Number, default: null },

    // in_progress -> submitted -> (pending_review if subjective present) -> graded
    status: {
      type: String,
      enum: ["in_progress", "submitted", "pending_review", "graded"],
      default: "in_progress",
    },
  },
  { timestamps: true }
);

// One attempt per student per exam
submissionSchema.index({ exam: 1, student: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
