import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  X,
  MessageSquare,
  Plus,
  TrendingUp,
  Clock,
  Activity,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import useDebounce from "../../hooks/useDebounce";
import { getDiscussions, createDiscussion } from "../../api/discussion.api";

// ─── Config ───────────────────────────────────────────────────
const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "coding", label: "Coding" },
  { value: "projects", label: "Projects" },
  { value: "higher_studies", label: "Higher Studies" },
  { value: "research", label: "Research" },
  { value: "study_tips", label: "Study Tips" },
];

const categoryStyle = {
  general: "bg-gray-100 text-gray-600 border border-gray-200",
  coding: "bg-blue-50 text-blue-800",
  projects: "bg-green-50 text-green-800",
  higher_studies: "bg-purple-50 text-purple-800",
  research: "bg-amber-50 text-amber-800",
  study_tips: "bg-rose-50 text-rose-800",
};

const categoryLabel = {
  general: "General",
  coding: "Coding",
  projects: "Projects",
  higher_studies: "Higher Studies",
  research: "Research",
  study_tips: "Study Tips",
};

const avatarStyle = {
  general: "bg-gray-100 text-gray-600",
  coding: "bg-blue-50 text-blue-700",
  projects: "bg-green-50 text-green-700",
  higher_studies: "bg-purple-50 text-purple-700",
  research: "bg-amber-50 text-amber-700",
  study_tips: "bg-rose-50 text-rose-700",
};

const relativeTime = (d) => {
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
};

const getInitials = (firstName = "", lastName = "") =>
  `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

// ─── Discussion Card ──────────────────────────────────────────
export const DiscussionCard = ({ discussion }) => (
  <Link
    to={`/discussions/${discussion._id}`}
    className="flex items-stretch gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-150 group"
  >
    {/* Upvote column */}
    <div className="flex flex-col items-center gap-1 flex-shrink-0 w-8 pt-0.5">
      <div className="flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 text-gray-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors">
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </div>
      <span className="text-xs font-medium text-gray-500 tabular-nums">
        {discussion.upvotes?.length ?? 0}
      </span>
    </div>

    {/* Vertical divider */}
    <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />

    {/* Body */}
    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
      {/* Top row: badge + time */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryStyle[discussion.category] ?? categoryStyle.general}`}
        >
          {categoryLabel[discussion.category] ?? discussion.category}
        </span>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {relativeTime(discussion.createdAt)}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-600 leading-snug transition-colors">
        {discussion.title}
      </h3>

      {/* Excerpt */}
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
        {discussion.content}
      </p>

      {/* Footer: tags + replies + author */}
      <div className="flex items-center justify-between gap-2 mt-1">
        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {discussion.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-gray-400">
              #{tag}
            </span>
          ))}
        </div>

        {/* Right side: replies + avatar + name */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {discussion.commentCount ?? 0}
          </span>

          <div className="flex items-center gap-1.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${avatarStyle[discussion.category] ?? avatarStyle.general}`}
            >
              {getInitials(
                discussion.author?.firstName,
                discussion.author?.lastName
              )}
            </div>
            <span className="text-xs text-gray-400">
              {discussion.author?.firstName} {discussion.author?.lastName}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Link>
);

// ─── Skeleton ─────────────────────────────────────────────────
export const Skeleton = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="flex items-stretch gap-3 p-4 bg-white border border-gray-100 rounded-xl animate-pulse"
      >
        {/* Vote col */}
        <div className="flex flex-col items-center gap-1.5 w-8 pt-0.5 flex-shrink-0">
          <div className="w-7 h-7 bg-gray-100 rounded-full" />
          <div className="w-4 h-3 bg-gray-100 rounded" />
        </div>

        <div className="w-px bg-gray-100 flex-shrink-0" />

        {/* Body */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="w-16 h-4 bg-gray-100 rounded-full" />
            <div className="w-10 h-3 bg-gray-100 rounded" />
          </div>
          <div className="w-3/4 h-4 bg-gray-100 rounded" />
          <div className="w-full h-3 bg-gray-100 rounded" />
          <div className="w-5/6 h-3 bg-gray-100 rounded" />
          <div className="flex items-center justify-between mt-1">
            <div className="flex gap-2">
              <div className="w-8 h-3 bg-gray-100 rounded" />
              <div className="w-8 h-3 bg-gray-100 rounded" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-gray-100 rounded-full" />
              <div className="w-16 h-3 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ─── Create Modal ─────────────────────────────────────────────
const CreateModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "general",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || form.tags.includes(tag) || form.tags.length >= 5) return;
    setForm((p) => ({ ...p, tags: [...p.tags, tag] }));
    setTagInput("");
  };

  const removeTag = (tag) =>
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await createDiscussion(form);
      onCreated(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            Start a discussion
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              maxLength={200}
              placeholder="What do you want to discuss?"
              value={form.title}
              onChange={set("title")}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 placeholder:text-gray-300 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">
              Category
            </label>
            <select
              value={form.category}
              onChange={set("category")}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 bg-white transition-all"
            >
              {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">
              Content <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Share your question, experience, or thoughts in detail..."
              value={form.content}
              onChange={set("content")}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 placeholder:text-gray-300 resize-none leading-relaxed transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">
              Tags <span className="text-gray-400 font-normal">(up to 5)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. dsa, gate, resume"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 placeholder:text-gray-300 transition-all"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post discussion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────
const Discussions = () => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const debouncedSearch = useDebounce(search, 400);

  const fetchDiscussions = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await getDiscussions({
          category: activeCategory === "all" ? undefined : activeCategory,
          search: debouncedSearch || undefined,
          sort,
          page,
          limit: 5,
        });
        setDiscussions(res.data.data.discussions);
        setPagination(res.data.data.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [activeCategory, debouncedSearch, sort],
  );

  useEffect(() => {
    fetchDiscussions(1);
  }, [fetchDiscussions]);

  const handleCreated = (newDiscussion) => {
    setDiscussions((prev) => [newDiscussion, ...prev]);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Discussions</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Ask questions, share experiences, get guidance
            {pagination.total > 0 && (
              <span className="ml-2 text-gray-300">
                · {pagination.total} posts
              </span>
            )}
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={13} /> Start discussion
          </button>
        )}
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search discussions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 placeholder:text-gray-300 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { value: "newest", label: "Newest", Icon: Clock },
            { value: "popular", label: "Popular", Icon: TrendingUp },
            { value: "active", label: "Active", Icon: Activity },
          ].map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                sort === value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              <Icon size={11} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
              activeCategory === cat.value
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <Skeleton />
      ) : discussions.length > 0 ? (
        <>
          <div className="space-y-3">
            {discussions.map((d) => (
              <DiscussionCard key={d._id} discussion={d} />
            ))}
          </div>
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => fetchDiscussions(p)}
                    className={`w-8 h-8 text-xs font-medium rounded-lg border transition-all ${
                      p === pagination.page
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-xl">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <MessageSquare size={16} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            No discussions yet
          </p>
          <p className="text-xs text-gray-400">
            {search
              ? `No results for "${search}"`
              : "Be the first to start a discussion"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Discussions;