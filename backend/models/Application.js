import mongoose from "mongoose";

const timelineEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: "" },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // ← who made this change
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drive",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "registered",

        "oa_scheduled",
        "oa_completed",

        "interview_scheduled",
        "interview_completed",

        "offer_received",

        "selected",
        "rejected",

        "withdrawn",
      ],
      default: "registered",
    },
    lastStatusUpdate: {
      type: Date,
      default: Date.now,
    },
    resumeUrl: { type: String, default: "" },
    currentRound: Number,
   
    timeline: { type: [timelineEntrySchema], default: [] },

    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// One application per student per drive — enforced at DB level
applicationSchema.index({ student: 1, drive: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);
export default Application;
