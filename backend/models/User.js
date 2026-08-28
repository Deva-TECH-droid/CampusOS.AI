import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      enum: [1, 2, 3, 4],
    },
    section: {
      type: String,
      required: [true, "Section is required"],
      trim: true,
      uppercase: true,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
    },
    rollNumber: {
      type: String,
      required: [true, "Roll number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    resumeUrl: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["student", "classrep", "faculty", "alumni", "superadmin", "placementCoordinator"],
      default: "student",
    },
    // Approval gate for the student-→-teacher and teacher-→-admin
    // registration flows. Existing/legacy accounts and roles outside that
    // flow (classrep, alumni, superadmin, placementCoordinator) default to
    // approved so nothing that worked before this feature breaks.
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    // Only meaningful when role === "faculty" and status === "pending" —
    // what the teacher told us they teach at signup, before an admin has
    // wired it to an actual classroom via facultyAssignments.
    requestedSubjects: { type: [String], default: [] },
    employeeId: { type: String, trim: true, sparse: true, unique: true },
    department: { type: String, trim: true },
    // Only meaningful for a pending student — which teacher+subject they
    // asked to join, so that teacher's approval queue can find them and
    // the approval action knows which classroom to add them to.
    pendingRequest: {
      faculty: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      subject: { type: String, default: null },
    },
    // Only meaningful when role === "alumni"
    alumniProfile: {
      graduationYear: { type: Number },
      currentCompany: { type: String, trim: true },
      currentRole: { type: String, trim: true },
    },
    // Only meaningful when role === "faculty" — which classroom+subject
    // combinations this person teaches. Powers the Faculty Portal (roster
    // attendance, exam creation, grading).
    facultyAssignments: [
      {
        classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
        subject: { type: String },
        _id: false,
      },
    ],
    registeredEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    followedClubs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
      },
    ],
    joinedClubs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
      },
    ],
    profilePicture: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      maxlength: 300,
    },

    github: {
      type: String,
      default: "",
    },

    linkedin: {
      type: String,
      default: "",
    },

    portfolio: {
      type: String,
      default: "",
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    // ── Face recognition attendance ──
    faceDescriptor: {
      type: [Number],
      default: undefined,
      select: false, // never leaked to the client in normal queries
    },
    faceEnrolled: {
      type: Boolean,
      default: false,
    },
    faceEnrolledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
