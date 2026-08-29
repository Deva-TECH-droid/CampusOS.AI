import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import PendingApproval from "../../pages/auth/PendingApproval.jsx";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // A pending/rejected account is blocked from every protected route,
  // regardless of role — this mirrors the backend's roleMiddleware check,
  // so someone can't just wait out a slow UI to reach a real page.
  if (user.status && user.status !== "approved") {
    return <PendingApproval />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;