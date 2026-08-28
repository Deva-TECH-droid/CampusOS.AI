import mongoose from "mongoose";

const discussionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["general", "coding", "projects", "higher_studies", "research", "study_tips"],
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    views:     { type: Number, default: 0 },
    upvotes:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isPinned:  { type: Boolean, default: false },
    isLocked:  { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    commentCount:    { type: Number, default: 0 },
    lastActivityAt:  { type: Date, default: Date.now },
  },
  { timestamps: true }
);

discussionSchema.index({ title: "text", content: "text" });

export default mongoose.model("Discussion", discussionSchema);