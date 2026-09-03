import mongoose from "mongoose";

// One row per turn in a chatbot conversation (either what the user typed,
// or what the bot replied). Kept flat and simple on purpose — this is
// conversation history for building LLM context, not a feature-rich
// messaging system, so it doesn't need threads/reactions/etc.
const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
  },
  { timestamps: true },
);

// Fetching "last N messages for this user" is the only query pattern this
// model needs to serve well (building conversation context on every turn).
chatMessageSchema.index({ user: 1, createdAt: -1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
export default ChatMessage;