import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    subject: { type: String, required: true },
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    attachmentUrl: { type: String, default: "" }, // reference material from the teacher
    maxMarks: { type: Number, required: true, min: 1, default: 10 },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
