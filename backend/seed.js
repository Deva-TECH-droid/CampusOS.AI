import mongoose from "mongoose";
import Classroom from "./models/Classroom.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Event from "./models/Event.js";

dotenv.config();

await connectDB();

const seedClassroom = async () => {
  try {
    const classroom = await Classroom.findOne({
      className: "CSE-A Semester 7",
    });

    await User.updateMany(
      {
        branch: "CSE",
        year: 4,
        section: "A",
      },
      {
        classroom: classroom._id,
      },
    );
    // const event= await Event.find().select("eventName");

    // console.log(event);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedClassroom();
