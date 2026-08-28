// Gate for the pending-approval flow: a student is pending until their
// requested teacher approves them; a teacher is pending until an admin
// approves them. While pending, they can still log in (so they can see
// their status) but can't hit substantive academic APIs.
//
// Roles outside that flow (classrep, alumni, superadmin,
// placementCoordinator) are never subject to this gate.
const requireApproved = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Not authenticated." });
  }

  const gatedRoles = ["student", "faculty"];
  if (!gatedRoles.includes(user.role)) return next();

  if (user.status === "approved") return next();

  if (user.status === "rejected") {
    return res.status(403).json({
      success: false,
      message: "Your registration was rejected. Contact your institution for details.",
    });
  }

  return res.status(403).json({
    success: false,
    message:
      user.role === "faculty"
        ? "Your account is awaiting admin approval."
        : "Your account is awaiting approval from your teacher.",
  });
};

export default requireApproved;
