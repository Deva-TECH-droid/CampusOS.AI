import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Heart,
  Building2,
  Loader2,
  Sparkles,
  GitBranch,
  Globe,
  MessageSquare,
  Calendar,
  Clock,
  User,
  Plus,
  X,
  Trash2,
  Send,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import {
  listStories,
  toggleLike,
  listAlumniTalks,
  createAlumniTalk,
  deleteAlumniTalk,
  addStoryComment,
} from "../../api/alumni.api";

export default function AlumniStories() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("talks"); // "talks", "experiences", "community"
  const [loading, setLoading] = useState(true);

  // Stories state
  const [stories, setStories] = useState([]);
  const [search, setSearch] = useState("");

  // Talks state (Req 14)
  const [talks, setTalks] = useState([]);
  const [showTalkModal, setShowTalkModal] = useState(false);
  const [talkForm, setTalkForm] = useState({
    speaker: "Mr. Jeevan",
    topic: "Career & Industry Experience in Tech",
    company: "XYZ Technologies",
    date: "20 September 2026",
    time: "2:00 PM",
    venue: "Main Auditorium & Google Meet",
    description: "Mr. Jeevan will be joining CampusOS for an exclusive Alumni Talk sharing industry insights and career guidance.",
  });
  const [submittingTalk, setSubmittingTalk] = useState(false);

  // Quick comments state
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [storiesRes, talksRes] = await Promise.all([
        listStories({ search }),
        listAlumniTalks(),
      ]);
      setStories(storiesRes?.data?.data?.stories || []);
      setTalks(talksRes?.data?.data?.talks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    listStories({ search })
      .then(({ data }) => setStories(data?.data?.stories || []))
      .finally(() => setLoading(false));
  };

  const handleLike = async (id) => {
    setStories((prev) =>
      prev.map((s) =>
        s._id === id
          ? {
            ...s,
            hasLiked: !s.hasLiked,
            likeCount: s.likeCount + (s.hasLiked ? -1 : 1),
          }
          : s
      )
    );
    try {
      await toggleLike(id);
    } catch {
      // best effort
    }
  };

  const handleCreateTalk = async (e) => {
    e.preventDefault();
    setSubmittingTalk(true);
    try {
      await createAlumniTalk(talkForm);
      setShowTalkModal(false);
      setTalkForm({
        speaker: "",
        topic: "",
        company: "",
        date: "",
        time: "",
        venue: "",
        description: "",
      });
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to create alumni talk.");
    } finally {
      setSubmittingTalk(false);
    }
  };

  const handleDeleteTalk = async (id) => {
    if (!window.confirm("Delete this alumni talk event?")) return;
    try {
      await deleteAlumniTalk(id);
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete.");
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const { data } = await addStoryComment(postId, commentText.trim());
      setStories((prev) =>
        prev.map((s) =>
          s._id === postId
            ? { ...s, comments: data?.data?.comments || [], commentCount: (s.commentCount || 0) + 1 }
            : s
        )
      );
      setCommentText("");
      setActiveCommentPostId(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Couldn't post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const isAlumniOrAdmin = user?.role === "alumni" || user?.role === "superadmin";

  const displayedStories =
    activeTab === "community"
      ? stories.filter((s) => s.postType === "community" || (s.comments && s.comments.length > 0))
      : stories.filter((s) => s.postType !== "community");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles size={20} className="text-amber-500" />
            Alumni Hub & Talks
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Connect with alumni, join invited alumni talks, learn from industry journeys, and view shared open-source projects
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === "superadmin" && (
            <button
              onClick={() => setShowTalkModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Plus size={14} /> Create Alumni Talk
            </button>
          )}

          {isAlumniOrAdmin && (
            <Link
              to="/alumni/share"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              <Sparkles size={14} /> Share Experience / Project
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("talks")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "talks"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
            }`}
        >
          <Calendar size={13} />
          Alumni Talks ({talks.length})
        </button>

        <button
          onClick={() => setActiveTab("experiences")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "experiences"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
            }`}
        >
          <Building2 size={13} />
          Experiences & Projects
        </button>

        <button
          onClick={() => setActiveTab("community")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "community"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
            }`}
        >
          <MessageSquare size={13} />
          Alumni Community & Discussions
        </button>
      </div>

      {/* TAB 1: ALUMNI TALKS (Requirement 14) */}
      {activeTab === "talks" && (
        <div className="space-y-4">
          {talks.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 text-xs shadow-sm">
              <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
              No alumni talks scheduled right now. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {talks.map((talk) => (
                <div
                  key={talk._id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3.5 relative"
                >
                  {user?.role === "superadmin" && (
                    <button
                      onClick={() => handleDeleteTalk(talk._id)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-600"
                      title="Delete talk"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Alumni Talk
                    </span>
                    <h3 className="text-base font-bold text-gray-900 pt-1">
                      {talk.topic}
                    </h3>
                    <p className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                      <User size={13} className="text-indigo-600" />
                      Speaker: <span className="text-gray-900 font-bold">{talk.speaker}</span> ({talk.company})
                    </p>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    {talk.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1 border-t border-gray-50">
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <Calendar size={13} className="text-amber-500" />
                      {talk.date}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <Clock size={13} className="text-blue-500" />
                      {talk.time}
                    </span>
                    {talk.venue && (
                      <span className="text-[11px] text-gray-400 ml-auto">
                        📍 {talk.venue}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2 & 3: EXPERIENCES & COMMUNITY (Requirements 15 & 16) */}
      {(activeTab === "experiences" || activeTab === "community") && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alumni posts by company, technology, or topic…"
              className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white shadow-xs"
            />
          </form>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-gray-400" size={22} />
            </div>
          ) : displayedStories.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 text-xs shadow-sm">
              No posts found.
            </div>
          ) : (
            <div className="space-y-4">
              {displayedStories.map((story) => (
                <div
                  key={story._id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {story.alumnus?.firstName ? story.alumnus.firstName[0] : "A"}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          {story.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {story.alumnus?.firstName} {story.alumnus?.lastName} · {story.role} at{" "}
                          <span className="font-semibold text-gray-800">{story.company}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {story.postType || "Experience"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {story.content}
                  </p>

                  {story.adviceForJuniors && (
                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-950">
                      <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-800 mb-1">
                        💡 Advice for Juniors:
                      </span>
                      {story.adviceForJuniors}
                    </div>
                  )}

                  {/* Project Links (Req 15) */}
                  {(story.githubLink || story.projectLink) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {story.githubLink && (
                        <a
                          href={story.githubLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
                        >
                          <GitBranch size={13} />
                          GitHub Project
                        </a>
                      )}
                      {story.projectLink && (
                        <a
                          href={story.projectLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                        >
                          <Globe size={13} />
                          Live Demo
                        </a>
                      )}
                    </div>
                  )}

                  {/* Like & Comment Buttons */}
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-xs">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(story._id)}
                        className={`flex items-center gap-1.5 font-medium transition-colors ${story.hasLiked ? "text-red-600 font-semibold" : "text-gray-500 hover:text-red-500"
                          }`}
                      >
                        <Heart
                          size={15}
                          className={story.hasLiked ? "fill-red-500 text-red-500" : ""}
                        />
                        <span>{story.likeCount || 0}</span>
                      </button>

                      <button
                        onClick={() =>
                          setActiveCommentPostId(
                            activeCommentPostId === story._id ? null : story._id
                          )
                        }
                        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 font-medium transition-colors"
                      >
                        <MessageSquare size={15} />
                        <span>{story.commentCount || story.comments?.length || 0} Comments</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-gray-400">
                      {new Date(story.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Comments Box (Requirement 16) */}
                  {activeCommentPostId === story._id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 bg-gray-50/60 p-3 rounded-xl">
                      <p className="text-[11px] font-bold text-gray-700">
                        Discussion Comments ({story.comments?.length || 0}):
                      </p>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(story.comments || []).length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No comments yet. Start the conversation!</p>
                        ) : (
                          story.comments.map((c, i) => (
                            <div key={i} className="text-xs bg-white p-2.5 rounded-lg border border-gray-100 space-y-0.5">
                              <div className="flex items-center justify-between text-[11px] text-gray-400">
                                <span className="font-semibold text-gray-900">
                                  {c.authorName || "Student / Alumni"}
                                </span>
                                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-gray-700">{c.content}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add comment input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment or ask a question…"
                          className="flex-1 text-xs rounded-xl border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                        <button
                          onClick={() => handleAddComment(story._id)}
                          disabled={submittingComment || !commentText.trim()}
                          className="p-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-40"
                        >
                          <Send size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Alumni Talk Modal (Requirement 14 - Admin) */}
      {showTalkModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTalk}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar size={16} className="text-amber-500" />
                Schedule New Alumni Talk
              </h3>
              <button
                type="button"
                onClick={() => setShowTalkModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Speaker Name *</label>
              <input
                value={talkForm.speaker}
                onChange={(e) => setTalkForm((f) => ({ ...f, speaker: e.target.value }))}
                placeholder="e.g. Mr. Jeevan"
                className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Talk Topic *</label>
              <input
                value={talkForm.topic}
                onChange={(e) => setTalkForm((f) => ({ ...f, topic: e.target.value }))}
                placeholder="e.g. Career & Industry Experience"
                className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Company / Organization *</label>
              <input
                value={talkForm.company}
                onChange={(e) => setTalkForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="e.g. XYZ Technologies"
                className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Date *</label>
                <input
                  value={talkForm.date}
                  onChange={(e) => setTalkForm((f) => ({ ...f, date: e.target.value }))}
                  placeholder="20 September"
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Time *</label>
                <input
                  value={talkForm.time}
                  onChange={(e) => setTalkForm((f) => ({ ...f, time: e.target.value }))}
                  placeholder="2:00 PM"
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Description *</label>
              <textarea
                value={talkForm.description}
                onChange={(e) => setTalkForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Event summary and agenda details…"
                className="w-full text-xs rounded-xl border border-gray-200 p-2.5"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTalkModal(false)}
                className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingTalk}
                className="px-4 py-1.5 bg-gray-950 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 disabled:opacity-50"
              >
                {submittingTalk ? "Publishing…" : "Publish Alumni Talk"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
