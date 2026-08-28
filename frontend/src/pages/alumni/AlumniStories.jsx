import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, Building2, Loader2, Sparkles } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { listStories, toggleLike } from "../../api/alumni.api";

const AlumniStories = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);
  const [search, setSearch] = useState("");

  const load = async (params = {}) => {
    const { data } = await listStories(params);
    setStories(data?.data?.stories || []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const runSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    load({ search }).finally(() => setLoading(false));
  };

  const like = async (id) => {
    setStories((prev) =>
      prev.map((s) =>
        s._id === id ? { ...s, liked: !s.liked, likeCount: s.likeCount + (s.liked ? -1 : 1) } : s
      )
    );
    try {
      await toggleLike(id);
    } catch {
      // best-effort — a stale count on failure isn't worth blocking the UI
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Alumni Experiences</h1>
          <p className="text-sm text-gray-500">
            Real stories from alumni about their roles, companies and journeys
          </p>
        </div>
        {user?.role === "alumni" && (
          <Link
            to="/alumni/share"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <Sparkles size={14} /> Share your experience
          </Link>
        )}
      </div>

      <form onSubmit={runSearch} className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company, role, or keyword…"
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </form>

      {loading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="animate-spin text-gray-300" size={22} />
        </div>
      ) : stories.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <Building2 size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No stories shared yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {stories.map((story) => (
            <div key={story._id} className="bg-white border border-gray-100 rounded-xl p-4">
              <Link to={`/alumni/${story._id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{story.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {story.alumnus?.firstName} {story.alumnus?.lastName} · {story.role} at{" "}
                      <span className="font-medium text-gray-700">{story.company}</span>
                      {story.graduationYear ? ` · Class of ${story.graduationYear}` : ""}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2.5 line-clamp-2">{story.content}</p>
              </Link>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div className="flex flex-wrap gap-1.5">
                  {(story.tags || []).slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => like(story._id)}
                  className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                    story.liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                  }`}
                >
                  <Heart size={14} fill={story.liked ? "currentColor" : "none"} />
                  {story.likeCount || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlumniStories;
