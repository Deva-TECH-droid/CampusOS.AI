import mongoose from "mongoose";

const selectionStepSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const placementDriveSchema = new mongoose.Schema(
  {
    companyName:        { type: String, required: true, trim: true },
    companyLogo:        { type: String, default: null },       // Cloudinary URL
    companyDescription: { type: String, default: "", trim: true },
    location:           { type: String, default: "", trim: true },

    role:    { type: String, required: true, trim: true },
    jobType: { type: String, enum: ["internship", "fulltime"], required: true },
    driveType: {
      type: String,
      enum: ["oncampus", "offcampus", "poolcampus"],
      required: true,
    },

    // Compensation — stored as strings for flexibility ("12 LPA", "Not Disclosed")
    ctc:     { type: String, default: null },
    stipend: { type: String, default: null },
    bond:    { type: String, default: null },

    // Eligibility
    batch:            { type: Number, default: null },    // graduation year, e.g. 2026
    eligibleBranches: { type: [String], default: [] },    // empty = all branches
    minCGPA:          { type: Number, default: 0, min: 0, max: 10 },
    minYear:          { type: Number, default: null },
    maxYear:          { type: Number, default: null },
    maxBacklogs:      { type: Number, default: 0 },
    slots:            { type: Number, default: null },    // null = unlimited

    // Dates
    registrationDeadline: { type: Date, default: null },
    oaDate:               { type: Date, default: null },       // ← added
    interviewDate:        { type: Date, default: null },       // ← added

    // Links
    applicationLink: { type: String, default: null },
    brochureUrl:     { type: String, default: null },

    // Process steps — sorted by `order` in queries
    selectionProcess: { type: [selectionStepSchema], default: [] },

    status: {
      type: String,
      enum: ["upcoming", "open", "closed"],
      default: "upcoming",
    },

    applicationCount: { type: Number, default: 0 },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Text index for company name + role search
placementDriveSchema.index({ companyName: "text", role: "text" });

const PlacementDrive = mongoose.model("PlacementDrive", placementDriveSchema);
export default PlacementDrive;