import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  Plus,
  Megaphone,
  UserPlus,
  UserMinus,
  ChevronRight,
  Image,
  Edit,
} from "lucide-react";
import { followClub, getClubDetails } from "../../api/club.api";
import useAuth from "../../hooks/useAuth";
import NoticeFeed from "../../components/cards/NoticeFeed";
import AnnouncementCard from "../announcements/AnnouncementCard";
import { deleteAnnouncement } from "../../api/announcement.api";

// ─── Helpers ──────────────────────────────────────────────────
const clubBg = [
  "bg-gray-900",
  "bg-blue-600",
  "bg-purple-600",
  "bg-green-600",
  "bg-orange-500",
  "bg-rose-600",
];

const categoryColor = {
  Technical: "bg-blue-50 text-blue-700",
  Cultural: "bg-purple-50 text-purple-700",
  Creative: "bg-orange-50 text-orange-700",
  Business: "bg-green-50 text-green-700",
};

const clubInitials = (name) =>
  name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const relativeTime = (d) => {
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const eligibilityLabel = (branches, years) => {
  if (!branches?.length && !years?.length) return "Open to All";
  const b = branches?.length ? branches.join(", ") : "All Branches";
  const y = years?.length ? `Year ${years.join(", ")}` : "All Years";
  return `${b} · ${y}`;
};

// ─── Skeleton ─────────────────────────────────────────────────
const Skeleton = () => (
  <div className="max-w-4xl mx-auto animate-pulse">
    <div className="w-24 h-4 bg-gray-100 rounded mb-6" />
    <div className="h-32 bg-gray-100 rounded-xl mb-2" />
    <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
      <div className="w-16 h-16 bg-gray-100 rounded-xl mb-4" />
      <div className="w-48 h-5 bg-gray-100 rounded mb-2" />
      <div className="w-32 h-3 bg-gray-100 rounded" />
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────
const EmptyState = ({ message }) => (
  <p className="text-xs text-gray-400 py-8 text-center bg-white border border-gray-100 rounded-xl">
    {message}
  </p>
);

// ─── Admin Btn ────────────────────────────────────────────────
const AdminBtn = ({ to, icon: Icon, label }) => (
  <Link
    to={to}
    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all duration-150 backdrop-blur-md bg-white/80"
  >
    <Icon size={12} />
    {label}
  </Link>
);

// ─── Section Header ───────────────────────────────────────────
const SectionHeader = ({ title, icon: Icon, count, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-gray-400" />
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {count > 0 && (
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
    {action}
  </div>
);

// ─── Event Card ───────────────────────────────────────────────
const EventCard = ({ event, past = false }) => (
  <Link
    to={`/community/events/${event._id}`}
    className={`flex items-start gap-4 p-4 bg-white border rounded-xl hover:border-gray-300 hover:shadow-sm transition-all duration-200 group
      ${past ? "border-gray-100 opacity-60" : "border-gray-100"}`}
  >
    {/* 1. ADDED: Mini Event Banner Preview Thumb */}
    <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 self-center relative">
      {event.banner ? (
        <img
          src={event.banner}
          alt=""
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        // Fallback calendar icon if no banner image has been uploaded yet
        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
          <Calendar size={16} />
        </div>
      )}
    </div>

    {/* 2. Date block */}
    <div className="flex-shrink-0 w-11 text-center">
      <div className="text-xs font-medium text-gray-400 uppercase leading-none mb-1">
        {new Date(event.endDateTime).toLocaleDateString("en-IN", {
          month: "short",
        })}
      </div>
      <div className="text-2xl font-bold text-gray-900 leading-none">
        {new Date(event.endDateTime).getDate()}
      </div>
    </div>

    {/* Divider */}
    <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />

    {/* Info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 leading-snug truncate">
          {event.eventName}
        </h4>
        {event.category && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0
            ${categoryColor[event.category] || "bg-gray-100 text-gray-600"}`}
          >
            {event.category}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-xs text-gray-400 truncate">
          <MapPin size={10} /> {event.venue}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400 truncate">
          <Users size={10} />{" "}
          {eligibilityLabel(event.eligibleBranches, event.eligibleYears)}
        </span>
      </div>
    </div>

    <ChevronRight
      size={14}
      className="text-gray-300 flex-shrink-0 self-center transition-transform group-hover:translate-x-0.5"
    />
  </Link>
);

// ─── Main ─────────────────────────────────────────────────────
const ClubDetail = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const payload = await getClubDetails(clubId);
        const {
          club: fetchedClub,
          events: fetchedEvents,
          announcements: fetchedAnnouncements,
          isAdmin: adminStatus,
        } = payload.data.data;
        // console.log(isAdmin);
        setClub(fetchedClub);
        setEvents(fetchedEvents || []);
        setAnnouncements(fetchedAnnouncements || []);
        console.log(fetchedAnnouncements);
        setIsAdmin(adminStatus);

        if (user) {
          const following = fetchedClub.clubFollowers?.some(
            (f) => f.toString() === user._id.toString(),
          );
          setIsFollowing(following);

          const member = fetchedClub.clubMembers?.some(
            (m) => m.toString() === user._id.toString(),
          );
          setJoined(member);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClub();
  }, [clubId, user]);

  const handleFollowButton = async () => {
    try {
      const payload = await followClub(clubId);
      setClub(payload.data.data.club);
      setUser(payload.data.data.user);
      setIsFollowing(payload.data.data.isFollowing);
    } catch (error) {
      console.error(error);
    }
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
  if (!club)
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-sm text-gray-400">Club not found.</p>
      </div>
    );

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.endDateTime) >= now);
  const pastEvents = events.filter((e) => new Date(e.endDateTime) < now);
  const bgClass = clubBg[club.clubName?.charCodeAt(0) % clubBg.length];
  const initials = clubInitials(club.clubName);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* ── Club Header ── */}
      <div className="mb-6">
        {/* ─── FIXED CLOUDINARY BANNER DISPLAY LAYER ─── */}
        <div className="h-40 bg-gray-100 rounded-xl relative overflow-hidden border border-gray-100 shadow-xs">
          {club.banner ? (
            <img
              src={club.banner}
              alt={`${club.clubName} Banner`}
              className="w-full h-full object-cover"
            />
          ) : (
            // Modern CSS mesh gradient fallback if banner is unpopulated
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
              <Image size={24} className="text-gray-300" />
            </div>
          )}

          {/* Admin Management Toolbar */}
          {isAdmin && (
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <AdminBtn
                to={`/clubs/${clubId}/create-notice`}
                icon={Plus}
                label="Post Notice"
              />
              <AdminBtn
                to={`/announcements/create/club/${clubId}`}
                icon={Plus}
                label="Post Announcement"
              />
              <button
                onClick={() =>
                  navigate(`/community/clubs/${clubId}/edit`, {
                    state: { club, isAdmin },
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all duration-150 bg-white shadow-2xs"
              >
                <Edit size={12} /> Edit Club
              </button>
            </div>
          )}
        </div>

        {/* Info Profile Overlay Card */}
        <div className="bg-white border border-gray-100 rounded-xl px-6 pt-0 pb-5 -mt-6 relative shadow-xs">
          <div
            className="flex items-end justify-between mb-4"
            style={{ marginTop: "-32px" }}
          >
            {/* ─── FIXED CLOUDINARY LOGO DISPLAY LAYER ─── */}
            <div
              className={`w-20 h-20 rounded-2xl border-4 border-white ${bgClass} flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden flex-shrink-0`}
            >
              {club.logo ? (
                <img
                  src={club.logo}
                  alt={`${club.clubName} Logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* User Engagement Trigger Interactions */}
            <div className="flex items-center gap-2 mt-8">
              <button
                onClick={handleFollowButton}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150
                ${
                  isFollowing
                    ? "border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 bg-gray-50"
                    : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 bg-white"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
              <button
                onClick={() => setJoined((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150
                ${
                  joined
                    ? "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                    : "bg-gray-900 text-white hover:bg-gray-700"
                }`}
              >
                {joined ? (
                  <>
                    <UserMinus size={12} /> Leave Club
                  </>
                ) : (
                  <>
                    <UserPlus size={12} /> Join Club
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Branding Content Block */}
          <h1 className="text-lg font-semibold text-gray-900">
            {club.clubName}
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            {club.category && (
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${categoryColor[club.category] || "bg-gray-100 text-gray-600"}`}
              >
                {club.category}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Users size={11} /> {club.clubFollowers?.length ?? 0} followers
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Users size={11} /> {club.clubMembers?.length ?? 0} members
            </span>
          </div>
        </div>
      </div>

      

      {/* ── About Description ── */}
      {club.description && (
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-4 shadow-2xs">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">About</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {club.description}
          </p>
        </section>
      )}

      <NoticeFeed
        targetType="clubs"
        targetId={clubId}
        title="Club Notices"
        canPost={user?.role === "superadmin"}
        showActions={user?.role === "superadmin"}
      />

      {/* ── Club Leads Team ── */}
      {club.clubAdmins?.length > 0 && (
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-4 mt-4 shadow-2xs">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Club Leads
          </h2>
          <div className="flex flex-wrap gap-2">
            {club.clubAdmins.map((admin, i) => (
              <div
                key={admin._id || i}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div
                  className={`w-6 h-6 rounded-full ${clubBg[i % clubBg.length]} flex items-center justify-center text-white text-[10px] font-bold`}
                >
                  {admin.firstName?.[0]}
                  {admin.lastName?.[0]}
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {admin.firstName} {admin.lastName}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Announcements Segment ── */}
      <section className="mb-4 mt-4">
        <SectionHeader
          title="Announcements"
          icon={Megaphone}
          count={announcements.length}
          action={
            isAdmin && (
              <AdminBtn
                to={`/community/club/${clubId}/announcements/create`}
                icon={Plus}
                label="Post Announcement"
              />
            )
          }
        />
        {announcements.length > 0 ? (
          <div className="flex flex-col gap-3">
            {/* {announcements.map((a) => (
              <AnnouncementCard
                key={a._id}
                announcement={a}
                bgClass={bgClass}
                initials={initials}
              />
            ))} */}
            {announcements.map((a) => (
              <AnnouncementCard
                key={a._id}
                announcement={a}
                variant="detail"
                avatarBg={bgClass}
                onDelete={handleDeleteAnnouncement} // passes the club's accent color as author avatar bg
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No announcements yet." />
        )}
      </section>

      {/* ── Upcoming Events Segment ── */}
      <section className="mb-4">
        <SectionHeader
          title="Upcoming Events"
          icon={Calendar}
          count={upcomingEvents.length}
          action={
            isAdmin && (
              <AdminBtn
                to={`/community/clubs/${clubId}/events/create`}
                icon={Plus}
                label="Create Event"
              />
            )
          }
        />
        {upcomingEvents.length > 0 ? (
          <div className="flex flex-col gap-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState message="No upcoming events." />
        )}
      </section>

      {/* ── Past Events Segment ── */}
      {pastEvents.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            title="Past Events"
            icon={Calendar}
            count={pastEvents.length}
          />
          <div className="flex flex-col gap-3">
            {pastEvents.map((event) => (
              <EventCard key={event._id} event={event} past />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ClubDetail;
