import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  MapPin,
  User,
  Bell,
  Calendar,
  ChevronRight,
  AlertCircle,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import {
  getClassroom,
  getDeadlines,
  deleteDeadline,
} from "../../../api/classroom.api";
import NoticeFeed from "../../../components/cards/NoticeFeed";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const getCurrentDay = () => {
  const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return DAYS.includes(day) ? day : "Monday";
};

const formatDueDate = (d) => {
  const date = new Date(d);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString())
    return { label: "Due Today", color: "text-red-600", urgent: true };
  if (date.toDateString() === tomorrow.toDateString())
    return { label: "Due Tomorrow", color: "text-amber-600", urgent: true };
  return {
    label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    color: "text-gray-500",
    urgent: false,
  };
};

const typeConfig = {
  assignment: {
    color: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-400",
  },
  quiz: {
    color: "bg-purple-50 text-purple-700 border-purple-100",
    dot: "bg-purple-400",
  },
  exam: { color: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-400" },
  lab: {
    color: "bg-green-50 text-green-700 border-green-100",
    dot: "bg-green-400",
  },
  project: {
    color: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-400",
  },
};

const noticeTypeColor = {
  cancellation: "bg-red-50 text-red-700 border-red-100",
  roomChange: "bg-amber-50 text-amber-700 border-amber-100",
  deadline: "bg-blue-50 text-blue-700 border-blue-100",
  exam: "bg-purple-50 text-purple-700 border-purple-100",
  general: "bg-gray-50 text-gray-700 border-gray-100",
};

const relativeTime = (d) => {
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── Skeleton ─────────────────────────────────────────────────
const Skeleton = () => (
  <div className="max-w-4xl mx-auto animate-pulse space-y-4">
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="w-32 h-5 bg-gray-100 rounded mb-2" />
      <div className="w-20 h-3 bg-gray-100 rounded" />
    </div>
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="w-40 h-4 bg-gray-100 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(2)].map((_, j) => (
            <div key={j} className="w-full h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────
const EmptyState = ({ message }) => (
  <p className="text-xs text-gray-400 text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
    {message}
  </p>
);

// ─── Period Card ──────────────────────────────────────────────
const PeriodCard = ({ period, index }) => {
  const colors = [
    "border-l-blue-400",
    "border-l-purple-400",
    "border-l-green-400",
    "border-l-orange-400",
    "border-l-rose-400",
    "border-l-teal-400",
  ];
  return (
    <div
      className={`flex items-center gap-4 p-3.5 bg-white border border-gray-100 border-l-4 ${colors[index % colors.length]} rounded-xl`}
    >
      <div className="flex-shrink-0 text-center w-16">
        <p className="text-xs font-bold text-gray-900">{period.startTime}</p>
        <p className="text-xs text-gray-400">{period.endTime}</p>
      </div>
      <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{period.subject}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <User size={10} /> {period.faculty}
          </span>
          {period.room && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin size={10} /> {period.room}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Deadline Card ────────────────────────────────────────────
const DeadlineCard = ({ deadline, classroomId, onDelete }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const due = formatDueDate(deadline.dueDate);
  const cfg = typeConfig[deadline.type] || typeConfig.assignment;

  const handleDelete = async () => {
    setMenuOpen(false);
    setDeleting(true);
    try {
      await deleteDeadline(classroomId, deadline._id);
      onDelete(deadline._id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`relative flex items-start gap-3.5 p-4 bg-white border rounded-xl transition-all duration-200
      ${due.urgent ? "border-amber-100 bg-amber-50/30" : "border-gray-100"}
      ${deleting ? "opacity-50" : ""}
    `}
    >
      {/* Left — type dot */}
      <div className="flex-shrink-0 mt-1">
        <span className={`w-2 h-2 rounded-full block ${cfg.dot}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {deadline.title}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}
              >
                {deadline.type}
              </span>
              {deadline.subject && (
                <span className="text-xs text-gray-400">
                  {deadline.subject}
                </span>
              )}
            </div>
            {deadline.description && (
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                {deadline.description}
              </p>
            )}
          </div>

          {/* Due date + menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <span className={`text-xs font-semibold ${due.color}`}>
                {due.label}
              </span>
              {due.urgent && (
                <p className="text-xs text-gray-400">
                  {new Date(deadline.dueDate).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>

            {/* Action menu — TODO: gate behind classRep/superadmin */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((p) => !p)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal size={14} />
              </button>

              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-7 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-32">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        // Pointing to your unified route path mapping format
                        navigate(
                          `/academics/${classroomId}/deadline/form/${deadline._id}`,
                          {
                            state: { deadline },
                          },
                        );
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────
const Classroom = () => {
  const { user } = useAuth();
  const { classroomId } = useParams();

  const [classroom, setClassroom] = useState(null);
  const [notices, setNotices] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [isClassRep,setIsClassRep]=useState(false);

  useEffect(() => {
    if (!user?._id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classroomRes, deadlinesRes] = await Promise.all([
          getClassroom(),
          getDeadlines(classroomId),
        ]);
        setClassroom(classroomRes?.data?.data.classroom || null);
        setIsClassRep(classroomRes?.data.data.isClassRep);
        setDeadlines(deadlinesRes?.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?._id, classroomId]);

  const handleDeleteDeadline = (id) => {
    setDeadlines((prev) => prev.filter((d) => d._id !== id));
  };

  if (loading) return <Skeleton />;

  const todayPeriods = classroom?.timetable?.[selectedDay] || [];
  const subjects = [
    ...new Set(
      Object.values(classroom?.timetable || {})
        .flat()
        .map((p) => p.subject),
    ),
  ];

  // const isClassRep =
  //   user?.role === "classrep" && user?.classroom == classroomId;

  const upcomingDeadlines = deadlines
    .filter((d) => new Date(d.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* ── Classroom Header ── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        {classroom ? (
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {classroom.className}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {[
                  classroom.branch,
                  `Year ${classroom.year}`,
                  `Section ${classroom.section}`,
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {classroom.classRepresentative && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <User size={11} /> Class Rep:{" "}
                  {classroom.classRepresentative.firstName}{" "}
                  {classroom.classRepresentative.lastName}
                </p>
              )}
            </div>
            {/* TODO: gate behind classRep/superadmin */}
            {isClassRep && (
              <Link
                to={`/classroom/${classroom._id}/create-notice`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all"
              >
                <Plus size={12} /> Post Notice
              </Link>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {user?.branch} — Year {user?.year}, Section {user?.section}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              No classroom assigned yet. Contact your administrator.
            </p>
          </div>
        )}
      </div>

      {/* ── Academic Notices ── */}

      <NoticeFeed
        targetType="classroom"
        targetId={classroomId}
        title="Academic Notices"
        canPost={isClassRep || user?.role === "superadmin"}
        showActions={isClassRep || user?.role === "superadmin"}
      />

      {/* ── Upcoming Deadlines ── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">
              Upcoming Deadlines
            </h3>
            {upcomingDeadlines.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {upcomingDeadlines.length}
              </span>
            )}
          </div>
          {classroom && isClassRep && (
            // TODO: gate behind classRep/superadmin
            <Link
              to={`/academics/${classroomId}/deadline/form`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all"
            >
              <Plus size={12} /> Add Deadline
            </Link>
          )}
        </div>
        {upcomingDeadlines.length > 0 ? (
          <div className="space-y-2">
            {upcomingDeadlines.map((deadline) => (
              <DeadlineCard
                key={deadline._id}
                deadline={deadline}
                classroomId={classroomId}
                onDelete={handleDeleteDeadline}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No upcoming deadlines." />
        )}
      </div>

      {/* ── Timetable ── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Timetable</h3>
        </div>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150
                ${
                  selectedDay === day
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        {todayPeriods.length > 0 ? (
          <div className="space-y-2">
            {todayPeriods
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((period, i) => (
                <PeriodCard key={i} period={period} index={i} />
              ))}
          </div>
        ) : (
          <EmptyState message={`No classes on ${selectedDay}.`} />
        )}
      </div>

      {/* ── Subjects ── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={14} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Subjects</h3>
        </div>
        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {subjects.map((subject, i) => (
              <Link
                key={i}
                to={`/academics/subjects/${encodeURIComponent(subject)}`}
                className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-300 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {subject.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
                    {subject}
                  </span>
                </div>
                <ChevronRight size={14} className="text-gray-300" />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState message="No subjects found. Timetable may not be configured." />
        )}
      </div>
    </div>
  );
};

export default Classroom;
