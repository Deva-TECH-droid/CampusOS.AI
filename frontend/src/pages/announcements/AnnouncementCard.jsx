import { Megaphone, Radio, Trash2 } from "lucide-react";
import { useState } from "react";
import useAuth from "../../hooks/useAuth";
// ─── Helpers ──────────────────────────────────────────────────
const relativeTime = (d) => {
  if (!d) return "—";
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
};

const clubBg = [
  "bg-gray-900",
  "bg-blue-600",
  "bg-purple-600",
  "bg-green-600",
  "bg-orange-500",
  "bg-rose-600",
];

const getAccentBg = (name) =>
  clubBg[(name?.charCodeAt(0) ?? 0) % clubBg.length];

const getInitials = (name) =>
  name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const typeConfig = {
  club: {
    label: "Club Announcement",
    icon: Megaphone,
    color: "bg-blue-50 text-blue-700",
  },
  event: {
    label: "Event Update",
    icon: Radio,
    color: "bg-purple-50 text-purple-700",
  },
};

const AnnouncementCard = ({
  announcement,
  variant = "detail",
  avatarBg,
  onClick,
  onDelete,
  isEligible, // Added onDelete callback prop
}) => {
  const isFeed = variant === "feed";
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  
  // ── Source info (feed variant) ──────────────────────────────
  const tType = announcement.targetType; // "club" | "event"
  const tConf = typeConfig[tType] || typeConfig.club;
  const TypeIcon = tConf.icon;


  const sourceName =
    tType === "club"
      ? announcement.club?.clubName
      : announcement.event?.eventName;

  const sourceAvatarBg = avatarBg || getAccentBg(sourceName);
  const sourceInitials = getInitials(sourceName);

  // ── Author info (detail variant) ────────────────────────────
  const author = announcement.postedBy;

  const isPopulated =
    author && typeof author === "object" && "firstName" in author;

  const authorName = isPopulated
    ? `${author.firstName ?? ""} ${author.lastName ?? ""}`.trim()
    : "System Admin";

  const authorInitials = isPopulated
    ? `${author.firstName?.[0] ?? ""}${author.lastName?.[0] ?? ""}`.toUpperCase()
    : "A";

  const authorAvatarBg = avatarBg || "bg-gray-800";

  // ── Delete Handler ──────────────────────────────────────────
  const handleDeleteClick = async (e) => {
    e.stopPropagation(); // Prevents clicking delete from opening the feed detail view

    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        setIsDeleting(true);
        // Call your external API handler passed down via props
        if (onDelete) {
          await onDelete(announcement._id);
        }
      } catch (error) {
        console.error("Failed to delete announcement:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div
      onClick={isFeed && onClick ? onClick : undefined}
      className={`bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-200
        ${isFeed && onClick ? "cursor-pointer hover:border-gray-300 hover:shadow-md" : ""}
        ${isDeleting ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {/* ── Image — feed: full-width hero; detail: inline ── */}
      {isFeed && announcement.image && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={announcement.image}
            alt={announcement.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4">
        {/* ── Feed header: type badge + timestamp + delete ── */}
        {isFeed && (
          <div className="flex items-center justify-between mb-3">
            <span
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tConf.color}`}
            >
              <TypeIcon size={11} />
              {tConf.label}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {relativeTime(announcement.createdAt)}
              </span>
              {(isEligible || user?.role === "superadmin") && (
                <button
                  onClick={handleDeleteClick}
                  className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                  title="Delete Announcement"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Detail header: author avatar + name + timestamp + delete ── */}
        {!isFeed && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full ${authorAvatarBg} flex items-center justify-center
                  text-white text-xs font-bold flex-shrink-0`}
              >
                {authorInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 leading-tight">
                  {authorName}
                </p>
                <p className="text-xs text-gray-400">
                  {relativeTime(announcement.createdAt)}
                </p>
              </div>
            </div>
            {(isEligible || user?.role === "superadmin") && (
                <button
                  onClick={handleDeleteClick}
                  className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                  title="Delete Announcement"
                >
                  <Trash2 size={14} />
                </button>
              )}
          </div>
        )}

        {/* ── Title ── */}
        <h4 className="text-sm font-bold text-gray-900 leading-snug mb-1.5">
          {announcement.title}
        </h4>

        {/* ── Body ── */}
        {announcement.body && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">
            {announcement.body}
          </p>
        )}

        {/* ── Image — detail variant: inline after body ── */}
        {!isFeed && announcement.image && (
          <div className="w-full rounded-xl overflow-hidden border border-gray-100 mb-3 bg-gray-50/50">
            <img
              src={announcement.image}
              alt={announcement.title}
              className="w-full h-auto max-h-[450px] object-contain mx-auto"
              loading="lazy"
            />
          </div>
        )}

        {/* ── Feed footer: source chip ── */}
        {isFeed && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
            <div
              className={`w-5 h-5 rounded-md ${sourceAvatarBg} flex items-center justify-center
                text-white font-bold flex-shrink-0`}
              style={{ fontSize: "8px" }}
            >
              {sourceInitials}
            </div>
            <span className="text-xs font-medium text-gray-500 truncate">
              {sourceName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCard;
