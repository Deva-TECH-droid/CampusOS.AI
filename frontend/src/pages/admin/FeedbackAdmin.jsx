import { useEffect, useState } from "react";
import { Star, MessageSquare, Loader2, RefreshCw, User, Calendar, ShieldCheck } from "lucide-react";
import { getAdminFeedbacks } from "../../api/chatbot.api";

export default function FeedbackAdmin() {
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({ total: 0, average: "0", distribution: {} });
  const [selectedFilter, setSelectedFilter] = useState("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await getAdminFeedbacks();
      setFeedbacks(data?.data?.feedbacks || []);
      setStats(data?.data?.stats || { total: 0, average: "0", distribution: {} });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredFeedbacks =
    selectedFilter === "all"
      ? feedbacks
      : feedbacks.filter((f) => String(f.rating) === String(selectedFilter));

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare size={20} className="text-amber-500" />
            Software & Assistant Feedback
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real user feedback submitted from the CampusOS AI chatbot and platform
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors w-fit"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold text-lg">
            <Star size={24} className="fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900">{stats.average}</span>
              <span className="text-xs text-gray-400 font-normal">/ 5.0</span>
            </div>
            <p className="text-xs text-gray-500">Average Rating</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            <MessageSquare size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Reviews</p>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between gap-1 text-[11px] text-gray-500">
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => setSelectedFilter(selectedFilter === String(star) ? "all" : String(star))}
                className={`px-2 py-1 rounded-md text-center border transition-all ${
                  selectedFilter === String(star)
                    ? "border-amber-400 bg-amber-50 text-amber-900 font-semibold"
                    : "border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-600"
                }`}
              >
                {star}★ ({stats.distribution?.[star] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">
            Showing {filteredFeedbacks.length} submitted reviews
          </span>
          {selectedFilter !== "all" && (
            <button
              onClick={() => setSelectedFilter("all")}
              className="text-xs text-indigo-600 hover:underline"
            >
              Clear filter ({selectedFilter}★)
            </button>
          )}
        </div>

        {filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No feedback entries found.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredFeedbacks.map((f) => (
              <div key={f._id} className="p-4 hover:bg-gray-50/50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-medium">
                      {f.userName ? f.userName[0].toUpperCase() : "U"}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                        {f.userName}
                        <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 capitalize">
                          {f.userRole}
                        </span>
                      </p>
                      {f.userEmail && (
                        <p className="text-[10px] text-gray-400">{f.userEmail}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={`${
                            i < f.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 ml-1">
                      {new Date(f.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  "{f.message}"
                </p>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                  <span>Category: {f.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
