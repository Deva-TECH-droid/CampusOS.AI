// Usage: roleMiddleware("superadmin") or roleMiddleware("superadmin", "classRep")
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}.`,
      });
    }

    // A role match alone isn't enough — a pending or rejected account
    // (self-registered student/teacher awaiting approval) must not reach
    // any role-gated route, even if the role itself is correct. This is
    // the backend enforcement point for the approval workflow; the
    // frontend's PendingApproval screen is just a courtesy on top of this.
    if (req.user.status && req.user.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          req.user.status === "pending"
            ? "Your account is still awaiting approval."
            : "Your account request was rejected.",
        accountStatus: req.user.status,
      });
    }

    next();
  };
};

export default roleMiddleware;