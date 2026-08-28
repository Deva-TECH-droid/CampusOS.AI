import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: true,
      index: true,
    },
    // If set → nested reply (reply to a reply). If null → direct reply to comment.
    parentReply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reply",
      default: null,
      index: true,
    },
    // Populated from parentReply.author — used to render "@FirstName" mention
    replyingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
    upvotes:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isEdited:  { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Reply", replySchema);