import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Hash,
  BookOpen,
  Calendar,
  MapPin,
  ChevronRight,
  Users,
  Briefcase,
  MessageSquare,
  GraduationCap,
  LogOut,
  KeyRound,
  Pencil,
  Camera,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  GitFork,
  UserCheck,
  Globe,
  FileText,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import axios from "../../api/axios";
import { getProfile, logoutApi, updateProfile } from "../../api/auth.api";
import ImageUploadZone from "../../components/forms/ImageUploadZone.jsx";

// ─── Helpers ──────────────────────────────────────────────────
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const statusConfig = {
  registered: { label: "Registered", color: "bg-blue-50 text-blue-700" },
  oa_scheduled: { label: "OA Scheduled", color: "bg-amber-50 text-amber-700" },
  oa_completed: {
    label: "OA Completed",
    color: "bg-purple-50 text-purple-700",
  },
  interview_scheduled: {
    label: "Interview Scheduled",
    color: "bg-indigo-50 text-indigo-700",
  },
  interview_completed: {
    label: "Interview Completed",
    color: "bg-teal-50 text-teal-700",
  },
  offer_received: {
    label: "Offer Received",
    color: "bg-green-50 text-green-700",
  },
  selected: { label: "Selected", color: "bg-green-50 text-green-700" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700" },
  withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-500" },
};

const clubBg = [
  "bg-gray-900",
  "bg-blue-600",
  "bg-purple-600",
  "bg-green-600",
  "bg-orange-500",
  "bg-rose-600",
];

const clubInitials = (name) =>
  name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const roleLabel = {
  student: "Student",
  classRep: "Class Representative",
  superadmin: "Super Admin",
};

const roleBadge = {
  student: "bg-gray-100 text-gray-600",
  classRep: "bg-blue-50 text-blue-700",
  superadmin: "bg-red-50 text-red-700",
};

// ─── Skeleton ─────────────────────────────────────────────────
const Skeleton = () => (
  <div className="max-w-5xl mx-auto animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-2xl bg-gray-100" />
            <div className="w-32 h-5 bg-gray-100 rounded" />
            <div className="w-24 h-3 bg-gray-100 rounded" />
            <div className="w-full h-8 bg-gray-100 rounded-lg mt-2" />
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full h-4 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl p-4 h-20"
            />
          ))}
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 h-40" />
        <div className="bg-white border border-gray-100 rounded-xl p-5 h-40" />
      </div>
    </div>
  </div>
);

// ─── Avatar ───────────────────────────────────────────────────
const Avatar = ({ user }) => {
  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="relative w-20 h-20 mx-auto">
      {user?.profilePicture ? (
        <img
          src={user.profilePicture}
          alt="Avatar"
          className="w-20 h-20 rounded-2xl object-cover border border-gray-100 shadow-sm"
        />
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-gray-900 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
          {initials}
        </div>
      )}
    </div>
  );
};

// ─── Edit Profile Modal ───────────────────────────────────────
const EditProfileModal = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    profilePicture: user?.profilePicture || "",
    github: user?.github || "", // Double check these fallbacks are active
    linkedin: user?.linkedin || "",
    portfolio: user?.portfolio || "",
    resumeUrl: user?.resumeUrl || "",
    bio: user?.bio || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) {
      setError("First name is required");
      return;
    }
    setLoading(true);
    try {
      console.log(form);
      const res = await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        profilePicture: form.profilePicture.trim(),

        // ─── FIXED: Changed keys to lowercase to match backend destructuring ───
        github: form.github ? form.github.trim() : "",
        linkedin: form.linkedin ? form.linkedin.trim() : "",

        portfolio: form.portfolio.trim(),
        resumeUrl: form.resumeUrl.trim(),
        bio: form.bio.trim(),
      });
      onSave(res.data.data);
      onClose();
    } catch (err) {
      // setError(err.response?.data?.message || "Failed to update profile");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md my-8">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            Edit Profile Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Profile Picture Upload Section (Small/Compact Size) */}
          <div className="border border-gray-50 rounded-xl p-3 bg-gray-50/50">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Profile Avatar Picture
            </label>
            <div className="w-28 max-w-full">
              <ImageUploadZone
                label="Avatar"
                value={form.profilePicture}
                folder="user-profiles"
                onChange={(uploadedUrl) =>
                  setForm((p) => ({ ...p, profilePicture: uploadedUrl }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, firstName: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, lastName: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 resize-none"
              placeholder="Tell us a bit about yourself..."
              rows={2}
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-50">
            <h4 className="text-xs font-semibold text-gray-900">
              Professional Links & Assets
            </h4>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <GitFork size={12} className="text-gray-400" /> GitHub URL
              </label>
              <input
                type="url"
                value={form.github || ""} // 👈 ADD "|| ''" FALLBACK HERE
                onChange={(e) =>
                  setForm((p) => ({ ...p, github: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                placeholder="https://github.com/username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <UserCheck size={12} className="text-gray-400" /> LinkedIn URL
              </label>
              <input
                type="url"
                value={form.linkedin || ""} // 👈 ADD "|| ''" FALLBACK HERE
                onChange={(e) =>
                  setForm((p) => ({ ...p, linkedin: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Globe size={12} className="text-gray-400" /> Portfolio Website
              </label>
              <input
                type="url"
                value={form.portfolio || ""} // 👈 ADD "|| ''" FALLBACK HERE
                onChange={(e) =>
                  setForm((p) => ({ ...p, portfolio: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                placeholder="https://portfolio.com"
              />
            </div>

            {/* Resume File URL Asset Handler */}
            <div className="pt-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <FileText size={12} className="text-gray-400" /> Resume PDF URL
              </label>
              <ImageUploadZone
                label="Resume PDF"
                value={form.resumeUrl}
                folder="student-resumes"
                onChange={(uploadedUrl) =>
                  setForm((p) => ({ ...p, resumeUrl: uploadedUrl }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Change Password Modal ────────────────────────────────────
const ChangePasswordModal = ({ onClose }) => {
  const [form, setForm] = useState({ current: "", newPw: "", confirm: "" });
  const [show, setShow] = useState({
    current: false,
    newPw: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const toggle = (field) => setShow((p) => ({ ...p, [field]: !p[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.current || !form.newPw || !form.confirm) {
      setError("All fields are required");
      return;
    }
    if (form.newPw.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (form.newPw !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.patch("/profile/password", {
        currentPassword: form.current,
        newPassword: form.newPw,
      });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const PwInput = ({ field, placeholder }) => (
    <div className="relative">
      <input
        type={show[field] ? "text" : "password"}
        value={form[field]}
        onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 pr-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
      />
      <button
        type="button"
        onClick={() => toggle(field)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show[field] ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            Change Password
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2
                size={13}
                className="text-green-600 flex-shrink-0"
              />
              <p className="text-xs text-green-700">
                Password changed successfully
              </p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Current Password
            </label>
            <PwInput field="current" placeholder="Enter current password" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <PwInput field="newPw" placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Confirm New Password
            </label>
            <PwInput field="confirm" placeholder="Repeat new password" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Section wrapper ──────────────────────────────────────────
const Section = ({ title, linkTo, linkLabel, children }) => (
  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {linkTo && (
        <Link
          to={linkTo}
          className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors"
        >
          {linkLabel || "View all"} <ChevronRight size={12} />
        </Link>
      )}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const EmptyState = ({ message }) => (
  <p className="text-xs text-gray-400 text-center py-5 bg-gray-50 rounded-xl border border-dashed border-gray-200">
    {message}
  </p>
);

// ─── Info Row ─────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, isLink, url }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
    <Icon size={13} className="text-gray-400 flex-shrink-0" />
    <span className="text-xs text-gray-400 w-24 flex-shrink-0">{label}</span>
    {isLink && url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium text-blue-600 hover:underline truncate max-w-[180px] sm:max-w-none"
      >
        {value || "View Link"}
      </a>
    ) : (
      <span className="text-xs font-medium text-gray-800 truncate max-w-[180px] sm:max-w-none">
        {value || "—"}
      </span>
    )}
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
    <div
      className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mx-auto mb-2`}
    >
      <Icon size={15} />
    </div>
    <p className="text-xl font-bold text-gray-900">{value ?? 0}</p>
    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</p>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────
const Profile = () => {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllClubs, setShowAllClubs] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [pwModal, setPwModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setProfile(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (_) {}
    logout();
    navigate("/login");
  };

  if (loading) return <Skeleton />;
  if (!profile)
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <p className="text-sm text-gray-400">Failed to load profile.</p>
      </div>
    );

  const {
    user,
    stats,
    classroom,
    followedClubs = [],
    registeredEvents = [],
    recentApplications = [],
  } = profile;

  const fullName = `${user.firstName} ${user.lastName}`;
  const cgpaColor =
    user.cgpa >= 8
      ? "text-green-600"
      : user.cgpa >= 6
        ? "text-amber-600"
        : "text-red-500";
  const visibleClubs = showAllClubs ? followedClubs : followedClubs.slice(0, 6);

  return (
    <div className="max-w-5xl mx-auto">
      {editModal && (
        <EditProfileModal
          user={user}
          onClose={() => setEditModal(false)}
          onSave={(updated) =>
            setProfile((p) => ({ ...p, user: { ...p.user, ...updated } }))
          }
        />
      )}
      {pwModal && <ChangePasswordModal onClose={() => setPwModal(false)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left Column ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile Card */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar user={user} />

              <div className="mt-4">
                <h2 className="text-base font-semibold text-gray-900">
                  {fullName}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {user.rollNumber}
                </p>
              </div>

              <span
                className={`mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${roleBadge[user.role] || roleBadge.student}`}
              >
                {roleLabel[user.role] || "Student"}
              </span>

              {/* Bio Sub-text Section */}
              {user.bio && (
                <p className="text-xs text-gray-500 mt-3 border-t border-gray-50 pt-3 italic line-clamp-3 w-full">
                  "{user.bio}"
                </p>
              )}

              {/* CGPA pill */}
              <div className="mt-3 flex items-center gap-2">
                <span className={`text-sm font-bold ${cgpaColor}`}>
                  {user.cgpa?.toFixed(2)}
                </span>
                <span className="text-xs text-gray-400">CGPA</span>
              </div>

              {/* Actions */}
              <div className="w-full mt-5 space-y-2">
                <button
                  onClick={() => setEditModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium border border-gray-200 text-gray-700 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all"
                >
                  <Pencil size={12} /> Edit Profile
                </button>
                <button
                  onClick={() => setPwModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium border border-gray-200 text-gray-700 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all"
                >
                  <KeyRound size={12} /> Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium border border-red-100 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all"
                >
                  <LogOut size={12} /> Logout
                </button>
              </div>
            </div>
          </div>

          {/* Account & Social Info */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Account & Social Info
            </h3>
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Hash} label="Roll No." value={user.rollNumber} />
            <InfoRow icon={BookOpen} label="Branch" value={user.branch} />
            <InfoRow icon={Calendar} label="Year" value={`Year ${user.year}`} />
            <InfoRow
              icon={MapPin}
              label="Section"
              value={`Section ${user.section}`}
            />

            {/* Added Social Media Rows */}
            <InfoRow
              icon={GitFork}
              label="GitHub"
              value={user.github ? "View GitHub" : "—"}
              isLink={!!user.github}
              url={user.github}
            />
            <InfoRow
              icon={UserCheck}
              label="LinkedIn"
              value={user.linkedin ? "View Profile" : "—"}
              isLink={!!user.linkedin}
              url={user.linkedin}
            />
            <InfoRow
              icon={Globe}
              label="Portfolio"
              value={user.portfolio ? "View Portfolio" : "—"}
              isLink={!!user.portfolio}
              url={user.portfolio}
            />
            <InfoRow
              icon={FileText}
              label="Resume"
              value={user.resumeUrl ? "Download Resume" : "—"}
              isLink={!!user.resumeUrl}
              url={user.resumeUrl}
            />
          </div>

          {/* Academic */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Academics
            </h3>
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <GraduationCap size={13} className="text-gray-400" />
                <span className="text-xs text-gray-500">Classroom</span>
              </div>
              <span className="text-xs font-medium text-gray-800">
                {classroom?.className || "Not assigned"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <BookOpen size={13} className="text-gray-400" />
                <span className="text-xs text-gray-500">CGPA</span>
              </div>
              <span className={`text-xs font-bold ${cgpaColor}`}>
                {user.cgpa?.toFixed(2)}
              </span>
            </div>
            {classroom && (
              <Link
                to="/academics"
                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all"
              >
                Go to Classroom <ChevronRight size={12} />
              </Link>
            )}
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Clubs Following"
              value={stats?.clubsFollowing}
              icon={Users}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Events Registered"
              value={stats?.eventsRegistered}
              icon={Calendar}
              color="bg-purple-50 text-purple-600"
            />
            <StatCard
              label="Discussions"
              value={stats?.discussionsCreated}
              icon={MessageSquare}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              label="Applications"
              value={stats?.placementApplications}
              icon={Briefcase}
              color="bg-amber-50 text-amber-600"
            />
          </div>

          {/* Following Clubs */}
          <Section
            title="Following Clubs"
            linkTo="/community/clubs"
            linkLabel="Explore clubs"
          >
            {followedClubs.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {visibleClubs.map((club, i) => (
                    <Link
                      key={club._id}
                      to={`/community/clubs/${club._id}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-300 transition-all group"
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${clubBg[i % clubBg.length]}`}
                      >
                        {club.logo ? (
                          <img
                            src={club.logo}
                            alt=""
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <span style={{ fontSize: "8px" }}>
                            {clubInitials(club.clubName)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 whitespace-nowrap">
                        {club.clubName}
                      </span>
                    </Link>
                  ))}
                </div>
                {followedClubs.length > 6 && (
                  <button
                    onClick={() => setShowAllClubs((p) => !p)}
                    className="mt-3 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {showAllClubs
                      ? "Show less"
                      : `Show ${followedClubs.length - 6} more`}
                  </button>
                )}
              </>
            ) : (
              <EmptyState message="You're not following any clubs yet." />
            )}
          </Section>

          {/* Registered Events */}
          <Section
            title="Registered Events"
            linkTo="/community/events"
            linkLabel="Browse events"
          >
            {registeredEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {registeredEvents.slice(0, 6).map((event) => (
                  <Link
                    key={event._id}
                    to={`/community/events/${event._id}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-300 transition-all group"
                  >
                    <div className="flex-shrink-0 w-9 text-center">
                      <p className="text-xs text-gray-400 uppercase leading-none">
                        {new Date(event.startDateTime).toLocaleDateString(
                          "en-IN",
                          { month: "short" },
                        )}
                      </p>
                      <p className="text-base font-bold text-gray-900 leading-none mt-0.5">
                        {new Date(event.startDateTime).getDate()}
                      </p>
                    </div>
                    <div className="w-px self-stretch bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-gray-700">
                        {event.eventName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {event.venue}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState message="No registered events." />
            )}
          </Section>

          {/* Career / Applications */}
          <Section
            title="Placement Applications"
            linkTo="/career/my-applications"
            linkLabel="View all"
          >
            {recentApplications.length > 0 ? (
              <div className="space-y-2">
                {recentApplications.map((app) => {
                  const cfg =
                    statusConfig[app.status] || statusConfig.registered;
                  return (
                    <Link
                      key={app._id}
                      to={`/career/drives/${app.drive?._id}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-300 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {app.drive?.companyLogo ? (
                          <img
                            src={app.drive.companyLogo}
                            alt=""
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-500">
                            {app.drive?.companyName?.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-gray-700">
                          {app.drive?.companyName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {app.drive?.role}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="You haven't applied to any placement drives yet." />
            )}
          </Section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
