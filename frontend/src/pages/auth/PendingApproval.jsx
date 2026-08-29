import { LogOut, Clock3, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import { roleToPortal } from "../../utils/portal.js";

const COPY = {
  pending: {
    icon: Clock3,
    tone: "text-amber-500",
    title: "Your account is awaiting approval",
    student:
      "A teacher needs to approve your registration request before you can access classes, attendance, or coursework. Check back soon.",
    faculty:
      "An admin needs to approve your teacher account before you can access the Teacher Portal.",
  },
  rejected: {
    icon: XCircle,
    tone: "text-red-500",
    title: "Your account request was rejected",
    student: "Your registration request wasn't approved. Contact your teacher or admin for details.",
    faculty: "Your teacher account request wasn't approved. Contact the admin for details.",
  },
};

const PendingApproval = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const status = user?.status || "pending";
  const copy = COPY[status] || COPY.pending;
  const Icon = copy.icon;
  const message = user?.role === "faculty" ? copy.faculty : copy.student;

  const handleLogout = async () => {
    const portal = roleToPortal(user?.role);
    await logout();
    navigate("/login", { state: { portal } });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <div className={`w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5 ${copy.tone}`}>
          <Icon size={26} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">{copy.title}</h1>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;