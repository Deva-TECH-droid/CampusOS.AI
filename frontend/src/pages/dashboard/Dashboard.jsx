import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  Briefcase,
  Trophy,
  ChevronRight,
  MapPin,
  User,
  Clock,
  Bell,
  Calendar,
  MessageSquare,
  GraduationCap,
  ArrowUp,
  Pin,
  AlertCircle,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { getDashboard } from "../../api/dashboard.api";
import NoticeFeed from "../../components/cards/NoticeFeed";

// ─── Helpers ──────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const formatTime = (d) =>
  new Date(d).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const relativeTime = (d) => {
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const formatDueDate = (d) => {
  const date = new Date(d);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
  if (date.toDateString() === today.toDateString())
    return { label: "Today", color: "text-red-600", bg: "bg-red-50" };
  if (date.toDateString() === tomorrow.toDateString())
    return { label: "Tomorrow", color: "text-amber-600", bg: "bg-amber-50" };
  if (diff <= 7)
    return { label: `${diff}d left`, color: "text-gray-600", bg: "bg-gray-50" };
  return { label: formatDate(d), color: "text-gray-400", bg: "bg-gray-50" };
};

const formatDeadline = (d) => {
  if (!d) return null;
  const diff = Math.floor((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: "Closed", color: "text-gray-400" };
  if (diff === 0) return { label: "Today", color: "text-red-600" };
  if (diff === 1) return { label: "Tomorrow", color: "text-amber-600" };
  return { label: `${diff}d left`, color: "text-gray-500" };
};

const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();
const isTomorrow = (d) => {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return new Date(d).toDateString() === t.toDateString();
};
const parseTime = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 3600000 + m * 60000;
};
const getCurrentDay = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long" });

const deadlineTypeColor = {
  assignment: "text-blue-700 bg-blue-50",
  quiz: "text-purple-700 bg-purple-50",
  exam: "text-red-700 bg-red-50",
  lab: "text-green-700 bg-green-50",
  project: "text-amber-700 bg-amber-50",
};

const noticePriorityConfig = {
  urgent: {
    border: "border-red-200",
    bg: "bg-red-50",
    dot: "bg-red-500",
    text: "text-red-800",
  },
  high: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
    text: "text-amber-800",
  },
  normal: {
    border: "border-gray-100",
    bg: "bg-white",
    dot: "bg-gray-400",
    text: "text-gray-700",
  },
  low: {
    border: "border-gray-100",
    bg: "bg-gray-50",
    dot: "bg-gray-300",
    text: "text-gray-500",
  },
};

const categoryColors = {
  general: "bg-gray-100 text-gray-600",
  coding: "bg-blue-50 text-blue-700",
  projects: "bg-green-50 text-green-700",
  higher_studies: "bg-purple-50 text-purple-700",
  research: "bg-amber-50 text-amber-700",
  study_tips: "bg-rose-50 text-rose-700",
};

const categoryLabel = {
  general: "General",
  coding: "Coding",
  projects: "Projects",
  higher_studies: "Higher Studies",
  research: "Research",
  study_tips: "Study Tips",
};

const periodAccents = [
  "border-l-blue-400",
  "border-l-violet-400",
  "border-l-emerald-400",
  "border-l-orange-400",
  "border-l-rose-400",
  "border-l-teal-400",
];

// ─── Reusable atoms ───────────────────────────────────────────
const Section = ({ title, icon: Icon, linkTo, linkLabel, children }) => (
  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-gray-400 flex-shrink-0" />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-900 transition-colors"
        >
          {linkLabel || "View all"} <ChevronRight size={11} />
        </Link>
      )}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const Empty = ({ message }) => (
  <div className="flex items-center justify-center h-16 rounded-xl bg-gray-50 border border-dashed border-gray-200">
    <p className="text-xs text-gray-400">{message}</p>
  </div>
);

const Skeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="w-52 h-7 bg-gray-100 rounded-lg mb-2" />
      <div className="w-40 h-4 bg-gray-100 rounded-lg mb-5" />
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl h-40"
          />
        ))}
      </div>
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-white border border-gray-100 rounded-xl"
            />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl h-36"
          />
        ))}
      </div>
    </div>
  </div>
);

// ─── Today's Summary ──────────────────────────────────────────
const TodaySummary = ({ stats, todayClassesCount, deadlines, notices }) => {
  // Compute frontend-derivable counts
  const assignmentsDue = deadlines.filter((dl) => {
    const diff = Math.ceil(
      (new Date(dl.dueDate) - new Date()) / (1000 * 60 * 60 * 24),
    );
    return diff <= 1 && diff >= 0;
  }).length;

  const newNoticesCount = stats.newNoticesCount ?? notices.length;
  const hasUrgentDeadlines = assignmentsDue > 0;

  const items = [
    {
      label: "Classes Today",
      value: todayClassesCount,
      color: "text-blue-600",
      bg: "bg-blue-50/80",
      urgent: false,
    },
    {
      label: "Deadlines",
      value: assignmentsDue,
      color: hasUrgentDeadlines ? "text-red-600" : "text-emerald-600",
      bg: hasUrgentDeadlines ? "bg-red-50/80" : "bg-emerald-50/80",
      urgent: hasUrgentDeadlines,
    },
    {
      label: "New Notices",
      value: newNoticesCount,
      color: "text-violet-600",
      bg: "bg-violet-50/80",
      urgent: false,
    },
    {
      label: "Upcoming Events",
      value: stats.upcomingEvents ?? 0,
      color: "text-amber-600",
      bg: "bg-amber-50/80",
      urgent: false,
    },
    {
      label: "Open Drives",
      value: stats.openDrives ?? 0,
      color: "text-emerald-600",
      bg: "bg-emerald-50/80",
      urgent: false,
    },
    {
      label: "Active Applications",
      value: stats.activeApplications ?? stats.applied ?? 0,
      color: "text-rose-600",
      bg: "bg-rose-50/80",
      urgent: false,
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mt-5">
      {items.map((item) => (
        <div
          key={item.label}
          className={`relative ${item.bg} rounded-xl px-3 py-3`}
        >
          {item.urgent && (
            <span className="absolute top-2 right-2">
              <AlertCircle size={10} className="text-red-400" />
            </span>
          )}
          <p className="text-xs text-gray-500 leading-tight mb-1.5">
            {item.label}
          </p>
          <p className={`text-2xl font-bold tabular-nums ${item.color}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
};

// ─── Period row ───────────────────────────────────────────────
const PeriodRow = ({ period, index, isEvent }) => (
  <div
    className={`flex items-center gap-3 p-3 border border-gray-100 rounded-xl border-l-4 ${
      isEvent
        ? "border-l-violet-400"
        : periodAccents[index % periodAccents.length]
    }`}
  >
    <div className="w-16 flex-shrink-0 text-center">
      <p className="text-xs font-bold text-gray-900 tabular-nums">
        {isEvent ? formatTime(period.startDateTime) : period.startTime}
      </p>
      {!isEvent && period.endTime && (
        <p className="text-xs text-gray-400 tabular-nums">{period.endTime}</p>
      )}
    </div>
    <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 truncate">
        {isEvent ? period.eventName : period.subject}
      </p>
      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
        {!isEvent && period.faculty && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <User size={9} /> {period.faculty}
          </span>
        )}
        {(isEvent ? period.venue : period.room) && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin size={9} />
            {isEvent ? period.venue : period.room}
          </span>
        )}
        {isEvent && (
          <span className="text-xs font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">
            Event
          </span>
        )}
      </div>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await getDashboard();
        setData(res.data.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <Skeleton />;

  const {
    classroom = null,
    deadlines = [],
    notices = [],
    events = [],
    drives = [],
    discussions = [],
    stats = {},
  } = data || {};

  const today = getCurrentDay();

  // Merge timetable + near events, sort by time
  const todayPeriods = (classroom?.timetable?.[today] || []).map((p) => ({
    ...p,
    _isEvent: false,
  }));
  const nearEvents = events
    .filter((e) => isToday(e.startDateTime) || isTomorrow(e.startDateTime))
    .map((e) => ({ ...e, _isEvent: true }));

  const todaySchedule = [...todayPeriods, ...nearEvents].sort((a, b) => {
    const aTime = a._isEvent
      ? new Date(a.startDateTime).getTime()
      : parseTime(a.startTime);
    const bTime = b._isEvent
      ? new Date(b.startDateTime).getTime()
      : parseTime(b.startTime);
    return aTime - bTime;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Header card ── */}
      <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {getGreeting()}, {user?.firstName} 👋
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 tracking-tight">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
        </div>

        {/* Today's Summary — replaces old StatsBar */}
        <TodaySummary
          stats={stats}
          todayClassesCount={todayPeriods.length}
          deadlines={deadlines}
          notices={notices}
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* ── Left col — 3/5 ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Today's schedule */}
          {classroom ? (
            <Section
              title="Today's Schedule"
              icon={Clock}
              linkTo={`/academics/classroom/${user?.classroom}`}
              linkLabel="Timetable"
            >
              {todaySchedule.length > 0 ? (
                <div className="space-y-2">
                  {todaySchedule.map((item, i) => (
                    <PeriodRow
                      key={i}
                      period={item}
                      index={i}
                      isEvent={item._isEvent}
                    />
                  ))}
                </div>
              ) : (
                <Empty message="No classes scheduled today" />
              )}
            </Section>
          ) : (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl px-5 py-6 text-center">
              <GraduationCap size={20} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">
                No classroom assigned yet
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Your Class Rep or Admin will set this up
              </p>
            </div>
          )}

          {/* Upcoming events */}
          <Section
            title="Upcoming Events"
            icon={Calendar}
            linkTo="/community/events"
            linkLabel="All events"
          >
            {events.length > 0 ? (
              <div className="space-y-2">
                {events.slice(0, 5).map((event) => (
                  <Link
                    key={event._id}
                    to={`/community/events/${event._id}`}
                    className="flex items-center gap-3 p-3 bg-gray-50/80 border border-gray-100 rounded-xl hover:border-gray-300 hover:bg-white transition-all group"
                  >
                    <div className="flex-shrink-0 w-10 text-center bg-white border border-gray-100 rounded-lg py-1.5">
                      <p className="text-xs font-medium text-gray-400 uppercase leading-none">
                        {new Date(event.startDateTime).toLocaleDateString(
                          "en-IN",
                          { month: "short" },
                        )}
                      </p>
                      <p className="text-lg font-bold text-gray-900 leading-tight tabular-nums">
                        {new Date(event.startDateTime).getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                        {event.eventName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {event.venue && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={9} /> {event.venue}
                          </span>
                        )}
                        {event.organizerClub?.clubName && (
                          <span className="text-xs text-gray-400 truncate">
                            · {event.organizerClub.clubName}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      size={13}
                      className="text-gray-300 flex-shrink-0"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <Empty message="No upcoming events" />
            )}
          </Section>

          {/* Recent discussions */}
          <Section
            title="Recent Discussions"
            icon={MessageSquare}
            linkTo="/discussions"
            linkLabel="All discussions"
          >
            {discussions.length > 0 ? (
              <div className="space-y-2">
                {discussions.map((d) => (
                  <Link
                    key={d._id}
                    to={`/discussions/${d._id}`}
                    className="flex items-start gap-3 p-3 bg-gray-50/80 border border-gray-100 rounded-xl hover:border-gray-300 hover:bg-white transition-all group"
                  >
                    <div className="flex-shrink-0 w-9 text-center pt-0.5">
                      <p className="text-sm font-bold text-gray-700 tabular-nums leading-none">
                        {d.commentCount ?? 0}
                      </p>
                      <p className="text-xs text-gray-400 leading-none mt-0.5">
                        replies
                      </p>
                    </div>
                    <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors leading-snug">
                        {d.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            categoryColors[d.category] || categoryColors.general
                          }`}
                        >
                          {categoryLabel[d.category] || d.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {relativeTime(d.createdAt)}
                        </span>
                        {(d.upvotes?.length ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400">
                            <ArrowUp size={10} /> {d.upvotes.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty message="No discussions yet" />
            )}
          </Section>
        </div>

        {/* ── Right col — 2/5 ── */}
        <div className="lg:col-span-2 space-y-4">

            {/* Notices */}
          <Section
            title="Important Notices"
            icon={Bell}
            linkTo="/notices"
            linkLabel="All notices"
          >
            <NoticeFeed targetType="dashboard" compact={true} />
          </Section>

           {/* Upcoming deadlines */}
          <Section
            title="Upcoming Deadlines"
            icon={BookOpen}
            linkTo={`/academics/classroom/${user?.classroom}`}
            linkLabel="Classroom"
          >
            {deadlines.length > 0 ? (
              <div className="space-y-2">
                {deadlines.slice(0, 5).map((dl) => {
                  const due = formatDueDate(dl.dueDate);
                  return (
                    <div
                      key={dl._id}
                      className="flex items-center gap-3 p-3 bg-gray-50/80 border border-gray-100 rounded-xl"
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          due.color === "text-red-600"
                            ? "bg-red-400"
                            : due.color === "text-amber-600"
                              ? "bg-amber-400"
                              : "bg-gray-300"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {dl.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                              deadlineTypeColor[dl.type] ||
                              deadlineTypeColor.assignment
                            }`}
                          >
                            {dl.type}
                          </span>
                          {dl.subject && (
                            <span className="text-xs text-gray-400 truncate">
                              {dl.subject}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold flex-shrink-0 px-2 py-0.5 rounded-lg ${due.bg} ${due.color}`}
                      >
                        {due.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty message="No upcoming deadlines" />
            )}
          </Section>

          {/* Quick access */}
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "Classroom",
                icon: GraduationCap,
                to: `/academics/classroom/${user.classroom}`,
                bg: "bg-blue-50",
                ic: "text-blue-600",
                hbg: "group-hover:bg-blue-100",
              },
              {
                label: "My Clubs",
                icon: Users,
                to: "/community/clubs",
                bg: "bg-purple-50",
                ic: "text-purple-600",
                hbg: "group-hover:bg-purple-100",
              },
              {
                label: "My Applications",
                icon: Briefcase,
                to: "/career/my-applications",
                bg: "bg-emerald-50",
                ic: "text-emerald-600",
                hbg: "group-hover:bg-emerald-100",
              },
              {
                label: "Competitive Prep",
                icon: Trophy,
                to: "/academics/competitive",
                bg: "bg-amber-50",
                ic: "text-amber-600",
                hbg: "group-hover:bg-amber-100",
              },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center gap-2 py-4 px-3 bg-white border border-gray-100 rounded-2xl hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${item.bg} ${item.hbg} flex items-center justify-center transition-colors duration-200`}
                >
                  <item.icon size={16} className={item.ic} />
                </div>
                <p className="text-xs font-medium text-gray-700 text-center leading-tight">
                  {item.label}
                </p>
              </Link>
            ))}
          </div>

          <Section
            title="Open Drives"
            icon={Briefcase}
            linkTo="/career/drives"
            linkLabel="All drives"
          >
            {drives.length > 0 ? (
              <div className="space-y-2">
                {drives.slice(0, 5).map((drive) => {
                  const dl = formatDeadline(drive.registrationDeadline);
                  return (
                    <Link
                      key={drive._id}
                      to={`/career/drives/${drive._id}`}
                      className="flex items-center gap-3 p-3 bg-gray-50/80 border border-gray-100 rounded-xl hover:border-gray-300 hover:bg-white transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {drive.companyLogo ? (
                          <img
                            src={drive.companyLogo}
                            alt=""
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-500">
                            {drive.companyName?.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                          {drive.companyName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {drive.role}
                        </p>
                      </div>
                      {dl && (
                        <span
                          className={`text-xs font-semibold flex-shrink-0 ${dl.color}`}
                        >
                          {dl.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Empty message="No open drives right now" />
            )}
          </Section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
