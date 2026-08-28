import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, Search } from "lucide-react";
import { getAllEvents, registerForEvent } from "../../api/event.api";
import useAuth from "../../hooks/useAuth";

const CATEGORIES = ["All", "Technical", "Cultural", "Creative", "Business"];

const categoryColor = {
  Technical: "text-blue-700 bg-blue-50",
  Cultural:  "text-purple-700 bg-purple-50",
  Creative:  "text-orange-700 bg-orange-50",
  Business:  "text-green-700 bg-green-50",
};

const statusConfig = {
  Upcoming:  { color: "text-emerald-700 bg-emerald-50", dot: "bg-emerald-500" },
  Ongoing:   { color: "text-blue-700 bg-blue-50",       dot: "bg-blue-500 animate-pulse" },
  Completed: { color: "text-gray-500 bg-gray-100",      dot: "bg-gray-400" },
  Cancelled: { color: "text-red-600 bg-red-50",         dot: "bg-red-500" },
};

// ─── Skeleton ─────────────────────────────────────────────────
const CardSkeleton = () => (
  <div className="border border-gray-100 rounded-2xl overflow-hidden animate-pulse bg-white">
    <div className="h-40 bg-gray-100" />
    <div className="p-4 space-y-3">
      <div className="w-1/3 h-3 bg-gray-100 rounded-full" />
      <div className="w-2/3 h-4 bg-gray-100 rounded" />
      <div className="w-1/2 h-3 bg-gray-100 rounded" />
      <div className="space-y-2 pt-1">
        <div className="w-full h-3 bg-gray-100 rounded" />
        <div className="w-3/4 h-3 bg-gray-100 rounded" />
      </div>
      <div className="pt-3 border-t border-gray-50 flex justify-between">
        <div className="w-20 h-5 bg-gray-100 rounded-full" />
        <div className="w-20 h-7 bg-gray-100 rounded-lg" />
      </div>
    </div>
  </div>
);

export default function Events() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [events,         setEvents]         = useState([]);
  const [filtered,       setFiltered]       = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search,         setSearch]         = useState("");
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllEvents();
        const data = res?.data?.data ?? [];
        setEvents(data);
        setFiltered(data);
      } catch {
        setError("Failed to load events. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let result = events;
    if (activeCategory !== "All")
      result = result.filter((e) => e.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.eventName.toLowerCase().includes(q) ||
          e.organizerClub?.clubName?.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [activeCategory, search, events]);

  const getStatus = (event) => {
    if (event.status === "Cancelled") return "Cancelled";
    const now = new Date();
    const start = new Date(event.startDateTime);
    const end   = new Date(event.endDateTime);
    if (now < start) return "Upcoming";
    if (now >= start && now <= end) return "Ongoing";
    return "Completed";
  };

  const formatTime = (event, status) => {
    if (!event.startDateTime) return "";
    const timeOpts = { hour: "2-digit", minute: "2-digit", hour12: false };
    if (status === "Ongoing") {
      const endTime = new Date(event.endDateTime).toLocaleTimeString("en-IN", timeOpts);
      return `Ends at ${endTime}`;
    }
    return new Date(event.startDateTime).toLocaleTimeString("en-IN", timeOpts);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

  const eligibilityLabel = (event) => {
    const b = event.eligibleBranches?.length ? event.eligibleBranches.join(", ") : "All Branches";
    const y = event.eligibleYears?.length    ? `Year ${event.eligibleYears.join(", ")}` : "All Years";
    return `${b} · ${y}`;
  };

  const handleRegister = async (e, eventId) => {
    e.stopPropagation();
    try {
      const payload = await registerForEvent(eventId);
      setEvents((prev) =>
        prev.map((ev) =>
          ev._id === eventId ? payload.data.data.event : ev,
        ),
      );
      setUser(payload.data.data.user);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-white">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-8 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">Events</span>
        <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg w-56 bg-white">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs text-gray-700 placeholder:text-gray-300 outline-none bg-transparent w-full"
          />
        </div>
      </div>

      <div className="px-8 py-6 max-w-6xl">
        {/* ── Category pills ── */}
        <div className="flex items-center gap-2 mb-7 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-1">
              <Calendar size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No events found</p>
            <p className="text-xs text-gray-400">
              {search ? `No results for "${search}"` : "Check back soon"}
            </p>
          </div>
        )}

        {/* ── Grid ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((event) => {
              const isRegistered   = event.registeredStudents?.some(
                (s) => (s._id ?? s) === user?._id,
              );
              const status         = getStatus(event);
              const statusCfg      = statusConfig[status] ?? statusConfig.Upcoming;
              const catColor       = categoryColor[event.category] ?? "text-gray-600 bg-gray-100";
              const isClosed       = status === "Completed" || status === "Cancelled";

              return (
                <div
                  key={event._id}
                  onClick={() => navigate(`/community/events/${event._id}`)}
                  className="group border border-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 bg-white flex flex-col"
                >
                  {/* ── Banner ── */}
                  <div className="relative h-40 bg-gray-50 overflow-hidden flex-shrink-0">
                    {event.banner ? (
                      <img
                        src={event.banner}
                        alt={event.eventName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Calendar size={28} className="text-gray-300" />
                      </div>
                    )}

                    {/* Gradient scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                    {/* Category badge — top left */}
                    <span className={`absolute top-2.5 left-2.5 text-xs font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm bg-white/80 ${catColor}`}>
                      {event.category}
                    </span>

                    {/* Date chip — top right */}
                    <span className="absolute top-2.5 right-2.5 text-xs font-medium text-gray-700 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      {formatDate(event.startDateTime)}
                    </span>

                    {/* Organizer name — bottom left over scrim */}
                    {event.organizerClub?.clubName && (
                      <span className="absolute bottom-2.5 left-3 text-xs font-medium text-white/90 truncate max-w-[70%]">
                        {event.organizerClub.clubName}
                      </span>
                    )}
                  </div>

                  {/* ── Body ── */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-gray-900 leading-snug mb-3 line-clamp-2 group-hover:text-gray-700 transition-colors">
                      {event.eventName}
                    </h3>

                    <div className="space-y-1.5 mb-4">
                      {event.venue && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin size={12} className="text-gray-300 flex-shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Users size={12} className="text-gray-300 flex-shrink-0" />
                        <span className="truncate">{eligibilityLabel(event)}</span>
                      </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                      {/* Status + time */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusCfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {status}
                        </span>
                        <span className="text-[11px] text-gray-400 truncate">
                          {formatTime(event, status)}
                        </span>
                      </div>

                      {/* Action button */}
                      {isRegistered ? (
                        <button
                          disabled
                          className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg cursor-default whitespace-nowrap flex-shrink-0"
                        >
                          ✓ Registered
                        </button>
                      ) : isClosed ? (
                        <button
                          disabled
                          className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg cursor-not-allowed whitespace-nowrap flex-shrink-0"
                        >
                          Closed
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleRegister(e, event._id)}
                          className="text-xs font-semibold text-white bg-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-700 active:scale-95 transition-all whitespace-nowrap flex-shrink-0"
                        >
                          Register
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}