import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  ChevronRight,
  Clock,
  Bell,
  TrendingUp,
  Calendar,
  FileText,
  MapPin,
  Timer,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { getCareerDashboard } from "../../api/career.api";
import NoticeFeed from "../../components/cards/NoticeFeed";

// ─── Helpers ──────────────────────────────────────────────────
const timeLeft = (d) => {
  if (!d) return null;
  const diff = new Date(d) - new Date();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (diff < 0)
    return { label: "Closed", color: "text-gray-400", urgent: false };
  if (days === 0)
    return { label: `${hrs}h left`, color: "text-red-600", urgent: true };
  if (days === 1)
    return { label: "Tomorrow", color: "text-amber-600", urgent: true };
  return { label: `${days}d left`, color: "text-gray-500", urgent: false };
};

const formatDateTime = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const jobTypeLabel = { internship: "Internship", fulltime: "Full Time" };

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

// ─── Logo Avatar ──────────────────────────────────────────────
const CompanyAvatar = ({ logo, name, size = "w-9 h-9" }) => (
  <div
    className={`${size} rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden`}
  >
    {logo ? (
      <img src={logo} alt={name} className="w-full h-full object-contain p-1" />
    ) : (
      <span className="text-xs font-bold text-gray-500">
        {name?.slice(0, 2).toUpperCase()}
      </span>
    )}
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────
const Skeleton = () => (
  <div className="max-w-5xl mx-auto animate-pulse space-y-5">
    <div className="bg-white border border-gray-100 rounded-xl p-3.5 grid grid-cols-4 gap-px">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="px-4 space-y-2">
          <div className="w-16 h-2.5 bg-gray-100 rounded" />
          <div className="w-8 h-5 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-xl p-4 h-16"
          />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-xl p-3 h-14"
          />
        ))}
      </div>
    </div>
  </div>
);

// ─── Section wrapper ──────────────────────────────────────────
const Section = ({ icon: Icon, title, action, children }) => (
  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-gray-400" />
        <span className="text-xs font-semibold text-gray-800">{title}</span>
      </div>
      {action}
    </div>
    <div className="p-3">{children}</div>
  </div>
);

const ViewAll = ({ to, label = "View all" }) => (
  <Link
    to={to}
    className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
  >
    {label} <ChevronRight size={11} />
  </Link>
);

const Empty = ({ text }) => (
  <p className="text-xs text-gray-400 text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
    {text}
  </p>
);

// ─── Drive row ────────────────────────────────────────────────
const DriveRow = ({ drive }) => {
  const deadline = timeLeft(drive.registrationDeadline);
  const pay = drive.jobType === "internship" ? drive.stipend : drive.ctc;

  return (
    <Link
      to={`/career/drives/${drive._id}`}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
    >
      <CompanyAvatar logo={drive.companyLogo} name={drive.companyName} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-gray-700">
          {drive.companyName}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs text-gray-400 truncate">{drive.role}</p>
          <span className="text-gray-200 text-xs">·</span>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {jobTypeLabel[drive.jobType]}
          </span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        {pay && <p className="text-xs font-semibold text-gray-700">{pay}</p>}
        {deadline && (
          <p className={`text-[10px] mt-0.5 font-medium ${deadline.color}`}>
            {deadline.label}
          </p>
        )}
      </div>
    </Link>
  );
};

// ─── Application row ──────────────────────────────────────────
const AppRow = ({ app }) => {
  const cfg = statusConfig[app.status] ?? statusConfig.registered;
  const deadline = timeLeft(app.drive.registrationDeadline);

  return (
    <Link
      to={`/career/drives/${app.drive._id}`}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
    >
      <CompanyAvatar
        logo={app.drive.companyLogo}
        name={app.drive.companyName}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-gray-700">
          {app.drive.companyName}
        </p>
        <p className="text-xs text-gray-400 truncate">{app.drive.role}</p>
      </div>
      <span
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}
      >
        {cfg.label}
      </span>
    </Link>
  );
};

// ─── Activity row ─────────────────────────────────────────────
const ActivityRow = ({ app }) => {
  const cfg = statusConfig[app.status] ?? statusConfig.registered;
  const date =
    app.status === "oa_scheduled" ? app.drive.oaDate : app.drive.interviewDate;

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
      <CompanyAvatar
        logo={app.drive.companyLogo}
        name={app.drive.companyName}
        size="w-8 h-8"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate">
          {app.drive.companyName}
        </p>
        <span
          className={`text-[10px] font-semibold px-1.5 py-px rounded-full ${cfg.color}`}
        >
          {cfg.label}
        </span>
      </div>
      {date && (
        <p className="text-[10px] text-amber-700 font-medium flex-shrink-0 text-right">
          {formatDateTime(date)}
        </p>
      )}
    </div>
  );
};

// ─── Deadline countdown row ───────────────────────────────────
const DeadlineRow = ({ drive }) => {
  const tl = timeLeft(drive.registrationDeadline);
  return (
    <Link
      to={`/career/drives/${drive._id}`}
      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
    >
      <CompanyAvatar
        logo={drive.companyLogo}
        name={drive.companyName}
        size="w-7 h-7"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">
          {drive.companyName}
        </p>
        <p className="text-[10px] text-gray-400 truncate">{drive.role}</p>
      </div>
      {tl && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0
          ${tl.urgent ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}
        >
          {tl.label}
        </span>
      )}
    </Link>
  );
};

// ─── Main ─────────────────────────────────────────────────────
const CareerDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getCareerDashboard();
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Skeleton />;

  const {
    eligibleDrives = [],
    myApplications = [],
    myActivities = [],
    recentNotices = [],
    stats = {},
  } = data || {};

  const isCoordinator = ["placementCoordinator", "superadmin"].includes(
    user?.role,
  );

  // Top 3 upcoming deadlines (eligibleDrives already sorted by deadline asc)
  const upcomingDeadlines = eligibleDrives.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ── Compact Stats Bar ── */}
      <div className="bg-white border border-gray-100 rounded-xl divide-x divide-gray-100 grid grid-cols-2 sm:grid-cols-4">
        {[
          {
            label: "Open for you",
            value: stats.eligibleDrives,
            icon: Briefcase,
            color: "text-blue-600",
          },
          {
            label: "Applied",
            value: stats.applied,
            icon: FileText,
            color: "text-green-600",
          },
          {
            label: "Upcoming OA",
            value: stats.upcomingOA,
            icon: TrendingUp,
            color: "text-amber-600",
          },
          {
            label: "Interviews",
            value: stats.upcomingInterviews,
            icon: Calendar,
            color: "text-purple-600",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-3.5">
            <Icon size={16} className={`${color} flex-shrink-0`} />
            <div>
              <p className="text-xl font-bold text-gray-900 leading-none">
                {value ?? 0}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Eligible Drives */}
          <Section
            icon={Briefcase}
            title="Open for You"
            action={<ViewAll to="/career/drives" />}
          >
            {eligibleDrives.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {eligibleDrives.map((d) => (
                  <DriveRow key={d._id} drive={d} />
                ))}
              </div>
            ) : (
              <Empty text="No eligible drives open right now." />
            )}
          </Section>

          {/* My Applications */}
          {myApplications.length > 0 && (
            <Section
              icon={FileText}
              title="My Applications"
              action={<ViewAll to="/career/my-applications" />}
            >
              <div className="divide-y divide-gray-50">
                {myApplications.map((a) => (
                  <AppRow key={a._id} app={a} />
                ))}
              </div>
            </Section>
          )}

          {/* Upcoming Activities (OA / Interviews) */}
          {myActivities.length > 0 && (
            <Section icon={Clock} title="Upcoming Activities">
              <div className="space-y-2">
                {myActivities.map((a) => (
                  <ActivityRow key={a._id} app={a} />
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">
          {/* Placement Notices */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Bell
                  size={13}
                  className={
                    recentNotices.some((n) => n.priority === "urgent")
                      ? "text-red-500"
                      : "text-gray-400"
                  }
                />
                <span className="text-xs font-semibold text-gray-800">
                  Placement Notices
                </span>
                {recentNotices.length > 0 && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-px rounded-full">
                    {recentNotices.length}
                  </span>
                )}
              </div>
              {isCoordinator && (
                <Link
                  to="/platform/notices/create"
                  className="text-[10px] font-medium text-gray-400 hover:text-gray-700 transition-colors"
                >
                  + Post
                </Link>
              )}
            </div>

            <div className="p-3">
              <NoticeFeed
                targetType="career"
                compact={true}
                title="Placement Notices"
                canPost={
                  user?.role === "superadmin" ||
                  user?.role == "placementCoordinator"
                }
                showActions={
                  user?.role === "superadmin" ||
                  user?.role == "placementCoordinator"
                }
              />
            </div>
          </div>

          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
                <Timer size={13} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-800">
                  Closing Soon
                </span>
              </div>
              <div className="p-3 divide-y divide-gray-50">
                {upcomingDeadlines.map((d) => (
                  <DeadlineRow key={d._id} drive={d} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerDashboard;
