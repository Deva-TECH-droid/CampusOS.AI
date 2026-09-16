import mongoose from "mongoose";

const competitiveResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },
    description: { type: String, trim: true, default: "" },
    url: { type: String, required: [true, "URL is required"], trim: true },
    category: {
      type: String,
      required: true,
      enum: ["dsa", "gate", "aptitude", "placements", "higherStudies"],
    },
    type: {
      type: String,
      required: true,
      enum: ["roadmap", "pyq", "playlist", "sheet", "book", "course", "other"],
      default: "other",
    },
    platform: { type: String, trim: true, default: "" },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

competitiveResourceSchema.index({ title: "text", description: "text" });

const CompetitiveResource = mongoose.model(
  "CompetitiveResource",
  competitiveResourceSchema,
);
export default CompetitiveResource;