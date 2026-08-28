import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  { text: { type: String, required: true } },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["mcq", "subjective"],
      required: true,
    },
    text: { type: String, required: true },
    marks: { type: Number, required: true, min: 1, default: 1 },
    // Optional topic tag (e.g. "Arrays", "Linked Lists") — powers the
    // topic-wise strong/weak performance breakdown.
    topic: { type: String, default: "General", trim: true },

    // MCQ only
    options: {
      type: [optionSchema],
      validate: {
        validator: function (opts) {
          return this.type !== "mcq" || (opts && opts.length >= 2);
        },
        message: "MCQ questions need at least 2 options.",
      },
    },
    correctOptionIndex: {
      type: Number,
      validate: {
        validator: function (val) {
          return (
            this.type !== "mcq" ||
            (Number.isInteger(val) && val >= 0 && val < (this.options?.length || 0))
          );
        },
        message: "correctOptionIndex must point at a valid option.",
      },
    },
  },
  { _id: true }
);

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    instructions: { type: String, default: "" },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (qs) => qs.length > 0,
        message: "An exam needs at least one question.",
      },
    },

    durationMinutes: { type: Number, required: true, min: 1 },
    scheduledAt: { type: Date, required: true },

    // Draft exams aren't visible to anyone but their creator. Submitting
    // for review sends it to the admin queue; only an admin approval
    // moves it to "published", which is when students can see it.
    status: {
      type: String,
      enum: ["draft", "pending_approval", "published", "rejected"],
      default: "draft",
    },
    rejectionReason: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },

    totalMarks: { type: Number, default: 0 },
    hasSubjective: { type: Boolean, default: false },

    // Set by faculty once all submissions (auto + manually graded) are
    // ready to be shown to students.
    resultsPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

examSchema.pre("save", function (next) {
  this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  this.hasSubjective = this.questions.some((q) => q.type === "subjective");
  next();
});

export default mongoose.model("Exam", examSchema);
