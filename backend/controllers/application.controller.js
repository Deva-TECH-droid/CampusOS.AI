import Application from "../models/Application.js";
import Drive from "../models/Drive.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";

// ─── POST /api/drives/:driveId/apply ──────────────────────────────────────────
export const applyToDrive = asyncHandler(async (req, res) => {
  const { driveId } = req.params;
  const user = req.user;


  // 1. Fetch drive document matching schema definition name
  const drive = await Drive.findById(driveId);
  if (!drive) {
    return res
      .status(404)
      .json({ success: false, message: "Drive not found." });
  }

  // 2. Validate operational lifecycle window status
  if (drive.status === "closed") {
    return res.status(400).json({
      success: false,
      message: "This drive is not open for applications.",
    });
  }

  // 3. Strict registration deadline enforcement check
  if (new Date() > new Date(drive.registrationDeadline)) {
    return res.status(400).json({
      success: false,
      message: "The registration deadline for this drive has passed.",
    });
  }

  // 4. Complete Server-Side Eligibility verification mapping against User attributes
  const reasons = [];

  if (drive.minCGPA > 0 && user.cgpa < drive.minCGPA) {
    reasons.push(`Min CGPA ${drive.minCGPA} required (yours: ${user.cgpa})`);
  }

  if (
    drive.eligibleBranches?.length > 0 &&
    !drive.eligibleBranches.includes(user.branch)
  ) {
    reasons.push(`Open to ${drive.eligibleBranches.join(", ")} only`);
  }

  // Added: Validate current user year against minYear and maxYear schema limits
  if (drive.minYear && user.year < drive.minYear) {
    reasons.push(`Min year ${drive.minYear} required`);
  }
  if (drive.maxYear && user.year > drive.maxYear) {
    reasons.push(`Open to year ${drive.maxYear} and below`);
  }

  // Added: Enforce backlog constraints matching driveSchema validation rules
  if (drive.maxBacklogs !== undefined && user.backlogs > drive.maxBacklogs) {
    reasons.push(
      `Maximum of ${drive.maxBacklogs} backlogs allowed (yours: ${user.backlogs})`,
    );
  }

  // If any criteria validations fail, abort and return standard payload mapping
  if (reasons.length > 0) {
    return res
      .status(403)
      .json({ success: false, message: reasons.join(". ") });
  }

  try {
    // 5. Persist the Application matching applicationSchema parameters precisely
    const application = await Application.create({
      student: user._id,
      drive: driveId,
      status: "registered",
      currentRound: 1, // Matches selectionProcess index base track entry
      timeline: [
        {
          status: "registered",
          note: "Applied by student via placement portal.",
          updatedBy: user._id,
          changedAt: new Date(),
        },
      ],
      appliedAt: new Date(),
    });

    // 6. Atomic increment execution of application counter metrics
    await Drive.findByIdAndUpdate(driveId, { $inc: { applicationCount: 1 } });

    // 7. Send sanitized confirmation back to frontend handleApply hook block execution
    return sendResponse(
      res,
      201,
      "Application submitted successfully.",
      application,
    );
  } catch (error) {
    // 8. Capture unique index compound constraint violations (student + drive duplicate blocks)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "You have already applied/registered for this placement drive.",
      });
    }
    throw error;
  }
});
// ─── GET /api/applications/mine ───────────────────────────────────────────────
export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ student: req.user._id })
    .populate({
      path: "drive",
      // Match the exact field parameters used across your layout elements
      select:
        "companyName companyLogo role jobType ctc stipend status registrationDeadline location",
    })
    .sort({ appliedAt: -1 }) // Keep the most recent applications at the top
    .lean();

  // 2. Filter out broken applications where the underlying drive was deleted
  // This guarantees application.drive will never evaluate to null on the frontend
  const validApplications = applications.filter((app) => app.drive !== null);

  sendResponse(
    res,
    200,
    "Applications fetched successfully.",
    validApplications,
  );
});

// ─── GET /api/applications/:id ────────────────────────────────────────────────
export const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    student: req.user._id, // students can only see their own
  }).populate(
    "drive",
    "companyName companyLogo role jobType ctc stipend status registrationDeadline oaDate interviewDate location selectionProcess companyDescription",
  );

  if (!application)
    return res
      .status(404)
      .json({ success: false, message: "Application not found." });
  sendResponse(res, 200, "Application fetched.", application);
});

// ─── PATCH /api/applications/:id/status  (coordinator or superadmin only) ─────
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note, currentRound } = req.body;

  const VALID_STATUSES = [
    "registered",
    "oa_scheduled",
    "oa_completed",
    "interview_scheduled",
    "selected",
    "rejected",
    "withdrawn",
  ];
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status." });
  }

  const application = await Application.findById(req.params.id);
  if (!application)
    return res
      .status(404)
      .json({ success: false, message: "Application not found." });

  application.status = status;
  if (currentRound !== undefined) application.currentRound = currentRound;

  application.timeline.push({
    status,
    note: note || "",
    updatedBy: req.user._id,
    changedAt: new Date(),
  });

  await application.save();
  sendResponse(res, 200, "Status updated.", application);
});

// ─── PATCH /api/applications/:id/notes  (student updates own private notes) ───
export const updateApplicationNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const application = await Application.findOneAndUpdate(
    { _id: req.params.id, student: req.user._id },
    { notes },
    { new: true },
  );

  if (!application)
    return res
      .status(404)
      .json({ success: false, message: "Application not found." });
  sendResponse(res, 200, "Notes updated.", application);
});

// ─── DELETE /api/applications/:id  (withdraw — student only) ─────────────────
export const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    student: req.user._id,
  });

  if (!application)
    return res.status(404).json({ success: false, message: "Not found." });
  if (["selected", "rejected"].includes(application.status)) {
    return res.status(400).json({
      success: false,
      message: "Cannot withdraw a finalised application.",
    });
  }

  application.status = "withdrawn";
  application.timeline.push({
    status: "withdrawn",
    note: "Withdrawn by student",
    updatedBy: req.user._id,
    changedAt: new Date(),
  });
  await application.save();

  await Drive.findByIdAndUpdate(application.drive, {
    $inc: { applicationCount: -1 },
  });
  sendResponse(res, 200, "Application withdrawn.");
});

// ─── GET /api/drives/:driveId/applications  (coordinator only) ────────────────
export const getDriveApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const query = { drive: req.params.driveId };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate(
        "student",
        "firstName lastName email branch year cgpa rollNumber",
      )
      .sort({ appliedAt: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Application.countDocuments(query),
  ]);

  sendResponse(res, 200, "Applications fetched.", {
    applications,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});
