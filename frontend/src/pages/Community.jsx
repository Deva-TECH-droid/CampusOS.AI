import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  X,
  Calendar,
  MapPin,
  Loader2,
  Users,
  ChevronRight,
  Megaphone,
  ArrowUpRight,
} from "lucide-react";
import { getCommunityFeed } from "../api/announcement.api";
import { getPopularClubs } from "../api/club.api";
import { getUpcomingEvents } from "../api/event.api";
import useAuth from "../hooks/useAuth";
import AnnouncementCard from "./announcements/AnnouncementCard";
import NoticeFeed from "../components/cards/NoticeFeed";

const clubBg = [
  "bg-slate-900",
  "bg-blue-600",
  "bg-purple-600",
  "bg-emerald-600",
  "bg-amber-500",
  "bg-rose-600",
];

// ─── Upcoming Events Widget (Enhanced Design) ─────────────────
const UpcomingEventsWidget = ({ events, loading }) => {
  const formatWidgetDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Upcoming Events</h3>
        </div>
        <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
          Live Timeline
        </span>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-50 rounded-xl" />
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-3.5">
          {events.slice(0, 3).map((event) => (
            <Link
              key={event._id}
              to={`/community/events/${event._id}`}
              className="block group bg-slate-50/40 border border-slate-100 rounded-xl overflow-hidden hover:border-slate-300 hover:bg-white hover:shadow-xs transition-all duration-200"
            >
              {/* Event Banner */}
              <div className="h-24 w-full bg-slate-100 relative overflow-hidden">
                {event.banner ? (
                  <img
                    src={event.banner}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-white/20 font-black tracking-wider uppercase text-xs">
                    EventSphere Live
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded-md text-slate-800 shadow-3xs">
                  {formatWidgetDate(event.startDateTime)}
                </div>
              </div>

              {/* Body */}
              <div className="p-3">
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 line-clamp-1 transition-colors">
                  {event.eventName}
                </h4>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                  <MapPin size={10} className="flex-shrink-0" />
                  <span className="truncate">
                    {event.venue || "Campus grounds"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center py-6">
          No scheduled entries active.
        </p>
      )}

      <Link
        to="/community/events"
        className="flex items-center justify-center gap-1 w-full mt-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-colors group"
      >
        View Complete Calendar
        <ArrowUpRight
          size={12}
          className="text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
        />
      </Link>
    </div>
  );
};

// ─── Trending Clubs Widget ────────────────────────────────────
const TrendingClubsWidget = ({ clubs, loading }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs">
    <div className="flex items-center gap-2 mb-4">
      <Users size={15} className="text-gray-400" />
      <h3 className="text-sm font-bold text-gray-900">Popular Clubs</h3>
    </div>

    {loading ? (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1">
            <div className="w-9 h-9 bg-gray-100 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-gray-100 rounded w-24" />
              <div className="h-2 bg-gray-100 rounded w-12" />
            </div>
          </div>
        ))}
      </div>
    ) : clubs.length > 0 ? (
      <div className="space-y-1">
        {clubs.slice(0, 4).map((club, i) => (
          <Link
            key={club._id}
            to={`/community/clubs/${club._id}`}
            className="flex items-center gap-3 p-2 border border-transparent rounded-xl hover:bg-slate-50 hover:border-slate-100 transition-all group"
          >
            <div
              className={`w-9 h-9 rounded-xl ${clubBg[i % clubBg.length]} flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden border border-black/5`}
            >
              {club.logo ? (
                <img
                  src={club.logo}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                club.clubName?.[0]?.toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900 truncate">
                {club.clubName}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-px">
                {club.clubFollowers?.length || 0} active followers
              </p>
            </div>
            <ChevronRight
              size={13}
              className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
            />
          </Link>
        ))}
      </div>
    ) : (
      <p className="text-xs text-slate-400 text-center py-4">
        No discovered networks.
      </p>
    )}
  </div>
);

// ─── Main View ────────────────────────────────────────────────
const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [feedItems, setFeedItems] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [trendingClubs, setTrendingClubs] = useState([]);

  // Pagination States
  const [offsets, setOffsets] = useState({
    eventOffset: 0,
    clubOffset: 0,
    generalOffset: 0,
  });
  const [hasMore, setHasMore] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [widgetLoading, setWidgetLoading] = useState(true);

  // Core Request dynamic loader method
  const fetchFeed = useCallback(
    async (
      currentOffsets = { eventOffset: 0, clubOffset: 0, generalOffset: 0 },
      append = false,
    ) => {
      try {
        if (append) setLoadMoreLoading(true);
        else setFeedLoading(true);

        const res = await getCommunityFeed(currentOffsets);
        const {
          feed = [],
          hasMore: nextHasMore,
          offsets: nextOffsets,
        } = res?.data?.data || {};

        setFeedItems((prev) => (append ? [...prev, ...feed] : feed));
        setHasMore(nextHasMore);
        setOffsets(nextOffsets);
      } catch (err) {
        console.error(err);
      } finally {
        setFeedLoading(false);
        setLoadMoreLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const fetchWidgets = async () => {
      try {
        setWidgetLoading(true);
        const [clubsRes, eventsRes] = await Promise.all([
          getPopularClubs(),
          getUpcomingEvents(),
        ]);
        setTrendingClubs(clubsRes?.data?.data || []);
        setUpcomingEvents(eventsRes?.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setWidgetLoading(false);
      }
    };

    fetchWidgets();
    fetchFeed({ eventOffset: 0, clubOffset: 0, generalOffset: 0 }, false);
  }, [user, fetchFeed]);

  const handleLoadMore = () => {
    if (!loadMoreLoading && hasMore) {
      fetchFeed(offsets, true);
    }
  };

  const types = ["All", "club", "event"];
  const typeLabels = {
    All: "All Activity",
    club: "Clubs Only",
    event: "Events Only",
  };

  const filtered = feedItems.filter((item) => {
    const matchesType = activeType === "All" || item.targetType === activeType;
    const sourceName =
      item.targetType === "club" ? item.club?.clubName : item.event?.eventName;
    return (
      matchesType &&
      (!search ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.body?.toLowerCase().includes(search.toLowerCase()) ||
        sourceName?.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2">
      {/* Search Header Action Panels */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white border border-slate-100 p-3 rounded-2xl shadow-3xs">
        <div className="relative w-full sm:w-80">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search matching feed keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-slate-300 placeholder:text-slate-400 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border whitespace-nowrap transition-all duration-150 shadow-3xs
                ${
                  activeType === type
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800"
                }`}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Layout Engine */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Feed */}
        <div className="flex-1 w-full min-w-0 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Timeline Activity Stream
            </h2>
            {!feedLoading && (
              <span className="text-xs text-slate-400 font-medium">
                {filtered.length} entries shown
              </span>
            )}
          </div>

          {feedLoading ? (
            <div className="space-y-4">
              <div className="h-32 bg-gray-50 border border-gray-100 animate-pulse rounded-2xl" />
              <div className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3.5">
              {filtered.map((item) => (
                <AnnouncementCard
                  key={item._id}
                  announcement={item}
                  variant="feed"
                  onClick={() =>
                    navigate(
                      item.targetType === "event"
                        ? `/community/events/${item.event?._id}`
                        : `/community/clubs/${item.club?._id}`,
                    )
                  }
                />
              ))}

              {/* Load More Trigger Handle Footer */}
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadMoreLoading}
                  className="flex items-center justify-center gap-2 w-full py-3 mt-4 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 rounded-xl hover:border-slate-400 hover:bg-slate-50/50 active:bg-slate-50 transition-all disabled:opacity-50"
                >
                  {loadMoreLoading ? (
                    <>
                      <Loader2
                        size={13}
                        className="animate-spin text-slate-400"
                      />{" "}
                      Synchronizing Pipeline...
                    </>
                  ) : (
                    "Load More Activity Updates"
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl text-center shadow-3xs">
              <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-3 shadow-3xs">
                <Megaphone size={15} className="text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                No synchronized updates active
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {search
                  ? "Try rewriting search matching criteria filter nodes."
                  : "Follow extra campus networks to inflate timelines."}
              </p>
            </div>
          )}
        </div>

        {/* Right Modular Sidebar (Sticky desktop, stacks fluidly on mobile) */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-5 order-1 lg:order-2 lg:sticky lg:top-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs">
            <NoticeFeed
              targetType="community"
              compact={true}
              title="Community Notices"
              canPost={false}
              showActions={false}
            />
          </div>
          <UpcomingEventsWidget
            events={upcomingEvents}
            loading={widgetLoading}
          />
          <TrendingClubsWidget clubs={trendingClubs} loading={widgetLoading} />
        </div>
      </div>
    </div>
  );
};

export default Community;
