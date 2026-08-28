import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Users,
  Megaphone,
  Plus,
  Edit3, // Imported Edit Icon
  ChevronRight,
} from "lucide-react";
import { getEventById, registerForEvent } from "../../api/event.api";
import {
  getAnnouncements,
  deleteAnnouncement,
} from "../../api/announcement.api";
import NoticeFeed from "../../components/cards/NoticeFeed";
import useAuth from "../../hooks/useAuth";
import AnnouncementCard from "../announcements/AnnouncementCard";

// ─── Helpers ──────────────────────────────────────────────────
const categoryColor = {
  Technical: "bg-blue-50 text-blue-700",
  Cultural: "bg-purple-50 text-purple-700",
  Creative: "bg-orange-50 text-orange-700",
  Business: "bg-green-50 text-green-700",
};

const statusConfig = {
  Upcoming: { color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  Ongoing: {
    color: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500 animate-pulse",
  },
  Completed: { color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
  Cancelled: { color: "bg-red-50 text-red-600", dot: "bg-red-500" },
};

const formatEventSchedule = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr)
    return { isMultiDay: false, start: "—", end: "—", timeLabel: "—" };

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const dateOpts = { day: "2-digit", month: "short", year: "numeric" };
  const timeOpts = { hour: "2-digit", minute: "2-digit", hour12: false };

  const isMultiDay = start.toDateString() !== end.toDateString();

  if (isMultiDay) {
    return {
      isMultiDay: true,
      start: `${start.toLocaleDateString("en-IN", dateOpts)} · ${start.toLocaleTimeString("en-IN", timeOpts)}`,
      end: `${end.toLocaleDateString("en-IN", dateOpts)} · ${end.toLocaleTimeString("en-IN", timeOpts)}`,
    };
  }

  return {
    isMultiDay: false,
    dateLabel: start.toLocaleDateString("en-IN", dateOpts),
    timeLabel: `${start.toLocaleTimeString("en-IN", timeOpts)} - ${end.toLocaleTimeString("en-IN", timeOpts)}`,
  };
};

const relativeTime = (d) => {
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const clubInitials = (name) =>
  name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "C";

function checkEligibility(event, user) {
  if (!user)
    return { eligible: false, reason: "You must be logged in to register." };
  const reasons = [];
  if (
    event.eligibleBranches?.length > 0 &&
    !event.eligibleBranches.includes(user.branch)
  )
    reasons.push(`Open to ${event.eligibleBranches.join(", ")} only`);
  if (
    event.eligibleYears?.length > 0 &&
    !event.eligibleYears.includes(user.year)
  )
    reasons.push(`Open to Year ${event.eligibleYears.join(", ")} only`);

  if (event.minCGPA > 0 && user.cgpa < event.minCGPA)
    reasons.push(
      `Minimum CGPA ${event.minCGPA} required (yours: ${user.cgpa})`,
    );

  return reasons.length === 0
    ? { eligible: true, reason: null }
    : { eligible: false, reason: reasons.join(" · ") };
}

const Skeleton = () => (
  <div className="max-w-3xl mx-auto animate-pulse px-4 py-6">
    <div className="w-20 h-4 bg-gray-100 rounded mb-6" />
    <div className="h-48 bg-gray-100 rounded-xl mb-6" />
    <div className="w-64 h-6 bg-gray-100 rounded mb-3" />
    <div className="w-full h-4 bg-gray-100 rounded mb-2" />
    <div className="w-3/4 h-4 bg-gray-100 rounded" />
  </div>
);

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [event, setEvent] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, announcementRes] = await Promise.all([
          getEventById(id),
          getAnnouncements("event", id),
        ]);
        const data = eventRes?.data?.data.event;
        setEvent(data);
        setIsOrganizer(eventRes.data.data.isOrganizer);

        setAnnouncements(announcementRes?.data?.data || []);

        if (
          user &&
          data?.registeredStudents?.some((s) => (s._id ?? s) === user._id)
        ) {
          setRegistered(true);
        }
      } catch {
        setError("Event not found or failed to load.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleRegister = async () => {
    setRegistering(true);
    setRegisterError("");
    try {
      const payload = await registerForEvent(id);
      setEvent(payload.data.data.event);
      setUser(payload.data.data.user);
      setRegistered(true);
    } catch (err) {
      setRegisterError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setRegistering(false);
    }
  };

  // ─── Edit Event Navigation Handler ──────────────────────────
  const handleEditClick = () => {
    // Navigates to edit form, embedding current layout state into history
    navigate(`/community/events/${id}/edit`, { state: { event } });
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      const payload = await deleteAnnouncement(id);
      setAnnouncements((prevAnnouncements) =>
        prevAnnouncements.filter((announcement) => announcement._id !== id),
      );
    } catch (error) {
      console.error("Failed to delete announcement from database:", error);
      alert("Something went wrong while deleting. Please try again.");
    }
  };

  if (loading) return <Skeleton />;

  if (error || !event)
    return (
      <div className="max-w-3xl mx-auto text-center py-20 px-4">
        <p className="text-sm text-gray-400 mb-3">
          {error || "Event not found."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-gray-500 underline hover:text-gray-800"
        >
          Go back
        </button>
      </div>
    );

  const calculateCurrentStatus = () => {
    if (event.status === "Cancelled") return "Cancelled";
    const now = new Date();
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);

    if (now < start) return "Upcoming";
    if (now >= start && now <= end) return "Ongoing";
    return "Completed";
  };

  const computedStatus = calculateCurrentStatus();
  const isCancelled = computedStatus === "Cancelled";
  const isCompleted = computedStatus === "Completed";

  const { eligible, reason: ineligibilityReason } = checkEligibility(
    event,
    user,
  );
  const canRegister = eligible && !registered && !isCancelled && !isCompleted;

  const catColor = categoryColor[event.category] ?? "bg-gray-100 text-gray-600";
  const statusCfg = statusConfig[computedStatus] ?? statusConfig.Upcoming;
  const latestAnnouncements = announcements.slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* ── Banner ── */}
      {event.banner && (
        <div className="h-52 rounded-xl overflow-hidden border border-gray-100 mb-6">
          <img
            src={event.banner}
            alt={event.eventName}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${catColor}`}
          >
            {event.category}
          </span>
          <span
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {computedStatus}
          </span>
          {event.tags?.map((tag) => (
            <span
              key={tag}
              className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        <h1 className="text-xl font-semibold text-gray-900 leading-snug mb-2">
          {event.eventName}
        </h1>

        {event.organizerClub && (
          <button
            onClick={() =>
              navigate(
                `/community/clubs/${event.organizerClub._id || event.organizerClub}`,
              )
            }
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            by{" "}
            <span className="font-medium text-gray-700">
              {event.organizerClub.clubName || "Club Domain"}
            </span>
          </button>
        )}
      </div>

      {/* ── Meta Parameters Info Row ── */}
      {(() => {
        const schedule = formatEventSchedule(
          event.startDateTime,
          event.endDateTime,
        );
        const gridItems = schedule.isMultiDay
          ? [
              { icon: Calendar, label: "Starts", value: schedule.start },
              { icon: Clock, label: "Ends", value: schedule.end },
              { icon: MapPin, label: "Venue", value: event.venue ?? "—" },
              {
                icon: Users,
                label: "Registered",
                value: `${event.registeredStudents?.length ?? 0} students`,
              },
            ]
          : [
              { icon: Calendar, label: "Date", value: schedule.dateLabel },
              { icon: Clock, label: "Time", value: schedule.timeLabel },
              { icon: MapPin, label: "Venue", value: event.venue ?? "—" },
              {
                icon: Users,
                label: "Registered",
                value: `${event.registeredStudents?.length ?? 0} students`,
              },
            ];

        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {gridItems.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-400">{label}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 leading-snug break-words">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Registration Access Interface Block ── */}
      <div className="mb-8">
        {registered && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">
              You're registered for this event
            </span>
          </div>
        )}

        {!registered && isCancelled && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm font-medium text-red-600">
              This event has been cancelled
            </p>
          </div>
        )}

        {!registered && isCompleted && (
          <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
            <p className="text-sm font-medium text-gray-500">
              This event has ended
            </p>
          </div>
        )}

        {!registered && !isCancelled && !isCompleted && !eligible && (
          <div className="space-y-2">
            <button
              disabled
              className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-400 text-sm font-medium rounded-xl cursor-not-allowed border border-gray-200"
            >
              Not eligible to register
            </button>
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
              {ineligibilityReason}
            </p>
          </div>
        )}

        {!user && !isCancelled && !isCompleted && (
          <button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
          >
            Sign in to register
          </button>
        )}

        {canRegister && (
          <div className="space-y-2">
            <button
              onClick={handleRegister}
              disabled={registering}
              className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs"
            >
              {registering && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {registering ? "Registering..." : "Register for Event"}
            </button>
            {registerError && (
              <p className="text-xs text-red-500">{registerError}</p>
            )}
          </div>
        )}
      </div>

      {/* ── About Content Description ── */}
      <section className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">
          About this Event
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
          {event.description || "No description provided."}
        </p>
      </section>

      

      {/* ── Organizer Layout Card ── */}
      {event.organizerClub && (
        <section
          className="bg-white border border-gray-100 rounded-xl p-4 mb-4 flex items-center gap-3 cursor-pointer hover:border-gray-300 transition-colors"
          onClick={() =>
            navigate(
              `/community/clubs/${event.organizerClub._id || event.organizerClub}`,
            )
          }
        >
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {event.organizerClub.logo ? (
              <img
                src={event.organizerClub.logo}
                alt=""
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              clubInitials(event.organizerClub.clubName)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">Organised by</p>
            <p className="text-sm font-semibold text-gray-900">
              {event.organizerClub.clubName || "Club Chapter"}
            </p>
          </div>
          <ChevronRight size={14} className="text-gray-300" />
        </section>
      )}

      <NoticeFeed
        targetType="events"
        targetId={id}
        title="Event Notices"
        canPost={user?.role === "superadmin"}
        showActions={user?.role === "superadmin"}
      />

      {/* ── Announcements Routing Section ── */}
      <section className="mb-8 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">
              Announcements
            </h2>
            {announcements.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {announcements.length}
              </span>
            )}
          </div>

          {/* ── Updated Controls Matrix (Organizer / Superadmin View) ── */}
          {(isOrganizer || user?.role === "superadmin") && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleEditClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all duration-150 bg-white"
              >
                <Edit3 size={12} /> Edit Event
              </button>
              <Link
                to={`/community/event/${id}/announcements/create`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white border border-transparent rounded-lg hover:bg-gray-700 transition-all duration-150"
              >
                <Plus size={12} /> Post Update
              </Link>
            </div>
          )}
        </div>

        {latestAnnouncements.length > 0 ? (
          <>
            <div className="flex flex-col gap-3">
              {latestAnnouncements.map((a) => (
                <AnnouncementCard
                  key={a._id}
                  announcement={a}
                  variant="detail"
                  onDelete={handleDeleteAnnouncement}
                  isEligible={isOrganizer}
                />
              ))}
            </div>

            {announcements.length > 3 && (
              <button className="w-full mt-3 py-2.5 text-xs font-medium text-gray-500 border border-gray-100 bg-white rounded-xl hover:border-gray-300 hover:text-gray-800 transition-colors flex items-center justify-center gap-1">
                View all {announcements.length} announcements{" "}
                <ChevronRight size={12} />
              </button>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400 py-8 text-center bg-white border border-gray-100 rounded-xl">
            No announcements yet.
          </p>
        )}
      </section>
    </div>
  );
}
