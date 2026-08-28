import mongoose from "mongoose";

const periodSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
    },

    faculty: {
      type: String,
      required: true,
    },

    room: {
      type: String,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const classroomSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      unique: true,
    },

    branch: {
      type: String,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    section: {
      type: String,
    },

    classRepresentative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    timetable: {
      Monday: [periodSchema],
      Tuesday: [periodSchema],
      Wednesday: [periodSchema],
      Thursday: [periodSchema],
      Friday: [periodSchema],
      Saturday: [periodSchema],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Classroom",
  classroomSchema
);