import mongoose from "mongoose";

const alumniCommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      default: "",
    },
    authorRole: {
      type: String,
      default: "student",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const alumniStorySchema = new mongoose.Schema(
  {
    alumnus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    graduationYear: { type: Number },

    // Denormalized so students can filter without a join.
    branch: { type: String, required: true },

    content: { type: String, required: true },
    adviceForJuniors: { type: String, default: "" },
    githubLink: { type: String, default: "" },
    projectLink: { type: String, default: "" },
    images: { type: [String], default: [] },
    postType: {
      type: String,
      enum: ["experience", "project", "advice", "community"],
      default: "experience",
    },
    tags: { type: [String], default: [] },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [alumniCommentSchema],
  },
  { timestamps: true }
);

export default mongoose.model("AlumniStory", alumniStorySchema);
