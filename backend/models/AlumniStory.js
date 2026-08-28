import mongoose from "mongoose";

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
    tags: { type: [String], default: [] },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("AlumniStory", alumniStorySchema);
