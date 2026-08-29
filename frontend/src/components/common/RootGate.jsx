import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import Welcome from "../../pages/Welcome.jsx";

/**
 * Sits at "/". Logged-in visitors skip straight to their dashboard;
 * everyone else sees the Welcome screen first — this is the very first
 * thing anyone sees when they open the app fresh.
 */
const RootGate = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  return <Welcome />;
};

export default RootGate;