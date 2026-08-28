import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discussion",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    upvotes:          [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isAcceptedAnswer: { type: Boolean, default: false },
    replyCount:       { type: Number, default: 0 },
    isEdited:         { type: Boolean, default: false },
    isDeleted:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);