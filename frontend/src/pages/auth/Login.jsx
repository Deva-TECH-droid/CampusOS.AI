import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ClipboardCheck, ShieldCheck } from "lucide-react";
import { loginApi, logoutApi } from "../../api/auth.api.js";
import useAuth from "../../hooks/useAuth.js";

const PORTALS = [
  {
    key: "student",
    label: "Student",
    icon: GraduationCap,
    matches: (role) => ["student", "classrep", "alumni"].includes(role),
    mismatchMessage: "This account isn't a Student account.",
    landing: "/",
  },
  {
    key: "teacher",
    label: "Teacher",
    icon: ClipboardCheck,
    matches: (role) => role === "faculty",
    mismatchMessage: "This account isn't a Teacher account.",
    landing: "/faculty",
  },
  {
    key: "admin",
    label: "Admin",
    icon: ShieldCheck,
    matches: (role) => role === "superadmin",
    mismatchMessage:
      "This account doesn't have Admin access. The Admin portal is restricted to the college's designated administrator account.",
    landing: "/admin",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [portal, setPortal] = useState("student");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activePortal = PORTALS.find((p) => p.key === portal);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const switchPortal = (key) => {
    setPortal(key);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await loginApi(form);
      const user = res.data.data;

      if (!activePortal.matches(user.role)) {
        // Wrong portal for this account — don't let the session stick
        // around client-side, and don't silently drop them into a
        // dashboard they didn't ask for.
        await logoutApi().catch(() => {});
        setError(activePortal.mismatchMessage);
        return;
      }

      setUser(user);
      navigate(activePortal.landing);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 flex-col justify-between p-14">
        <div>
          <span className="text-white text-xl font-semibold tracking-tight">
            CampusOS
          </span>
        </div>
        <div>
          <h1 className="text-white text-4xl font-light leading-tight mb-6">
            Your campus,
            <br />
            <span className="font-semibold">centralised.</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Academics, attendance, tests, placements, alumni — everything your
            college runs on, in one place.
          </p>
        </div>
        <p className="text-gray-600 text-xs">
          © {new Date().getFullYear()} CampusOS
        </p>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <span className="text-gray-900 text-xl font-semibold tracking-tight">
              CampusOS
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Sign in</h2>
            <p className="text-sm text-gray-500">
              Choose your portal and enter your credentials.
            </p>
          </div>

          {/* Portal tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-xl mb-6">
            {PORTALS.map((p) => {
              const Icon = p.icon;
              const active = portal === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => switchPortal(p.key)}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon size={16} />
                  {p.label}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@college.edu"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 transition-all placeholder:text-gray-300"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Password
                </label>
              </div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 transition-all placeholder:text-gray-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 active:bg-gray-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                `Sign in as ${activePortal.label}`
              )}
            </button>
          </form>

          {portal === "student" && (
            <p className="mt-6 text-sm text-gray-500 text-center">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-gray-900 font-medium hover:underline underline-offset-2"
              >
                Create one
              </Link>
            </p>
          )}
          {portal === "teacher" && (
            <p className="mt-6 text-sm text-gray-500 text-center">
              Don't have an account?{" "}
              <Link
                to="/signup-teacher"
                className="text-gray-900 font-medium hover:underline underline-offset-2"
              >
                Register as a teacher
              </Link>
            </p>
          )}
          {portal === "admin" && (
            <p className="mt-6 text-xs text-gray-400 text-center">
              Admin access is provisioned by the platform owner, not through sign-up.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
