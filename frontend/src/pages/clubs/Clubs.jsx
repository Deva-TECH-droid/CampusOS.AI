import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, X, Users, Plus } from "lucide-react";
import { getAllClubs, followClub } from "../../api/club.api";
import useAuth from "../../hooks/useAuth";

const CATEGORIES = ["All", "Technical", "Cultural", "Creative", "Business"];

const categoryColor = {
  Technical: "bg-blue-50 text-blue-700",
  Cultural: "bg-purple-50 text-purple-700",
  Creative: "bg-orange-50 text-orange-700",
  Business: "bg-green-50 text-green-700",
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

// ─── Club Card ────────────────────────────────────────────────
const ClubCard = ({ club, index, followed, onFollow }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-200 flex flex-col gap-4">
      {/* Top row — avatar + category */}
      <div className="flex items-start justify-between">
        <div
          className={`w-12 h-12 rounded-xl ${clubBg[index % clubBg.length]} flex items-center justify-center text-white text-base font-bold flex-shrink-0`}
        >
          {club.logo ? (
            <img
              src={club.logo}
              alt={club.clubName}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            clubInitials(club.clubName)
          )}
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColor[club.category] || "bg-gray-100 text-gray-600"}`}
        >
          {club.category}
        </span>
      </div>

      {/* Club info */}
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 leading-snug">
          {club.clubName}
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
          {club.description || "No description available."}
        </p>
      </div>

      {/* Followers count */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Users size={12} />
        <span>{club.clubFollowers?.length ?? 0} followers</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
        <button
          type="button"
          onClick={() => onFollow(club._id)}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150
            ${
              followed
                ? "border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50"
                : "border-gray-900 bg-gray-900 text-white hover:bg-gray-700"
            }`}
        >
          {followed ? "Following" : "Follow"}
        </button>
        <Link
          to={`/community/clubs/${club._id}`}
          className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-all duration-150 text-center"
        >
          View Club
        </Link>
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────
const EmptyState = ({ search, category }) => (
  <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center">
    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
      <Users size={20} className="text-gray-400" />
    </div>
    <p className="text-sm font-medium text-gray-600 mb-1">No clubs found</p>
    <p className="text-xs text-gray-400">
      {search
        ? `No results for "${search}"`
        : `No ${category !== "All" ? category : ""} clubs yet`}
    </p>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────
const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const { user, setUser } = useAuth(); 

  useEffect(() => {
    const fetchAllClubs = async () => {
      try {
        const payload = await getAllClubs();
        setClubs(payload.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllClubs();
  }, []);

  const handleFollow = async (clubId) => {
    try {
      const payload = await followClub(clubId);
      
      setClubs((prevClubs) =>
        prevClubs.map((club) =>
          club._id === clubId ? payload.data.data.club : club
        )
      );

      setUser(payload.data.data.user);
    } catch (error) {
      console.error("Network follow assertion query cycle failed:", error);
    }
  };

  const filtered = clubs.filter((club) => {
    const matchesCategory =
      activeCategory === "All" || club.category === activeCategory;
    const matchesSearch =
      club.clubName?.toLowerCase().includes(search.toLowerCase()) ||
      club.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">All Clubs</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? "Loading..." : `${clubs.length} clubs on campus`}
          </p>
        </div>
        {user?.role === "superadmin" && (
          <Link
            to="/community/clubs/create"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={13} />
            Create Club
          </Link>
        )}
      </div>

      {/* Search + Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search clubs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150
                ${
                  activeCategory === cat
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Club Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse"
            >
              <div className="flex justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                <div className="w-16 h-5 bg-gray-100 rounded-full" />
              </div>
              <div className="w-32 h-4 bg-gray-100 rounded mb-2" />
              <div className="w-full h-3 bg-gray-100 rounded mb-1" />
              <div className="w-3/4 h-3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length > 0 ? (
            filtered.map((club, i) => (
              <ClubCard
                key={club._id}
                club={club}
                index={i}
                // ✅ FIXED: Evaluates directly against user profile array to support clean data re-renders
                followed={user?.followedClubs?.some((id) => id.toString() === club._id.toString()) ?? false}
                onFollow={handleFollow}
              />
            ))
          ) : (
            <EmptyState search={search} category={activeCategory} />
          )}
        </div>
      )}
    </div>
  );
};

export default Clubs;