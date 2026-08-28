import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowUp,
  Bookmark,
  MessageSquare,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  X,
  PenSquare, // Added for an interactive prompt layout icon
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import {
  getDiscussionById,
  upvoteDiscussion,
  bookmarkDiscussion,
  addComment,
  upvoteComment,
  acceptAnswer,
  deleteComment,
  addReply,
  upvoteReply,
  deleteReply,
  deleteDiscussion,
} from "../../api/discussion.api";

// ─── Config ───────────────────────────────────────────────────
const categoryStyle = {
  general: "bg-gray-100 text-gray-600",
  coding: "bg-blue-50 text-blue-700",
  projects: "bg-green-50 text-green-700",
  higher_studies: "bg-purple-50 text-purple-700",
  research: "bg-amber-50 text-amber-700",
  study_tips: "bg-rose-50 text-rose-700",
};
const categoryLabel = {
  general: "General",
  coding: "Coding",
  projects: "Projects",
  higher_studies: "Higher Studies",
  research: "Research",
  study_tips: "Study Tips",
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

const Avatar = ({ user, size = "sm" }) => {
  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();
  const sz = size === "sm" ? "w-6 h-6 text-xs" : "w-9 h-9 text-sm";
  return (
    <div
      className={`${sz} rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600 flex-shrink-0`}
    >
      {initials}
    </div>
  );
};

// ─── Recursive Reply Node ─────────────────────────────────────
const ReplyNode = ({
  reply,
  discussionId,
  commentId,
  currentUser,
  isDiscussionAuthor,
  depth,
  onDeleteReply,
  onNewReply,
}) => {
  const [upvotes, setUpvotes] = useState(reply.upvotes?.length ?? 0);
  const [upvoted, setUpvoted] = useState(
    reply.upvotes?.some((u) => (u._id ?? u) === currentUser?._id),
  );
  const [replyBox, setReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const inputRef = useRef(null);

  const isOwner =
    currentUser && currentUser._id === (reply.author?._id ?? reply.author);
  const children = reply.children ?? [];

  const handleUpvote = async () => {
    if (!currentUser) return;
    try {
      const res = await upvoteReply(discussionId, commentId, reply._id);
      setUpvotes(res.data.data.upvotes);
      setUpvoted(res.data.data.upvoted);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      await deleteReply(discussionId, commentId, reply._id);
      onDeleteReply(reply._id);
    } catch (err) {
      console.error(err);
    }
  };

  const openReplyBox = () => {
    setReplyBox(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await addReply(discussionId, commentId, {
        content: replyText.trim(),
        parentReplyId: reply._id,
      });
      onNewReply(reply._id, res.data.data);
      setReplyText("");
      setReplyBox(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const borderColors = [
    "border-gray-200",
    "border-gray-200",
    "border-gray-100",
    "border-gray-100",
  ];
  const borderColor =
    borderColors[Math.min(depth - 1, borderColors.length - 1)];

  return (
    <div className={`pl-3 ${depth > 0 ? `border-l ${borderColor}` : ""}`}>
      <div className="py-2">
        <div className="flex items-center gap-2 mb-1">
          <Avatar user={reply.author} size="sm" />
          <span className="text-xs font-medium text-gray-800">
            {reply.author?.firstName} {reply.author?.lastName}
          </span>
          {reply.replyingTo && (
            <span className="text-xs text-blue-500">
              @{reply.replyingTo.firstName}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {relativeTime(reply.createdAt)}
          </span>
          {reply.isEdited && (
            <span className="text-xs text-gray-300">(edited)</span>
          )}
        </div>

        <p className="text-xs text-gray-700 leading-relaxed ml-8 mb-1.5">
          {reply.content}
        </p>

        <div className="flex items-center gap-3 ml-8">
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1 text-xs transition-colors ${
              upvoted
                ? "text-gray-900 font-semibold"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <ArrowUp size={11} /> {upvotes}
          </button>

          {currentUser && (
            <button
              onClick={openReplyBox}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Reply
            </button>
          )}

          {children.length > 0 && (
            <button
              onClick={() => setCollapsed((p) => !p)}
              className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              {collapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
              {collapsed ? `Show ${children.length}` : "Hide"}
            </button>
          )}

          {(isOwner || currentUser?.role === "superadmin") && (
            <button
              onClick={handleDelete}
              className="text-xs text-gray-300 hover:text-red-500 transition-colors ml-1"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>

        {replyBox && (
          <div className="flex gap-2 mt-2 ml-8">
            <input
              ref={inputRef}
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitReply();
                }
              }}
              placeholder={`Reply to ${reply.author?.firstName}...`}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-900 placeholder:text-gray-300 transition-all"
            />
            <button
              onClick={handleSubmitReply}
              disabled={submitting || !replyText.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              {submitting ? "..." : "Post"}
            </button>
            <button
              onClick={() => {
                setReplyBox(false);
                setReplyText("");
              }}
              className="p-1.5 text-gray-400 hover:text-gray-700"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {!collapsed && children.length > 0 && (
        <div>
          {children.map((child) => (
            <ReplyNode
              key={child._id}
              reply={child}
              discussionId={discussionId}
              commentId={commentId}
              currentUser={currentUser}
              isDiscussionAuthor={isDiscussionAuthor}
              depth={depth + 1}
              onDeleteReply={onDeleteReply}
              onNewReply={onNewReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Comment Block ────────────────────────────────────────────
const CommentBlock = ({
  comment,
  discussionId,
  currentUser,
  isDiscussionAuthor,
  onDelete,
  onAccept,
}) => {
  const [upvotes, setUpvotes] = useState(comment.upvotes?.length ?? 0);
  const [upvoted, setUpvoted] = useState(
    comment.upvotes?.some((u) => (u._id ?? u) === currentUser?._id),
  );
  const [replyTree, setReplyTree] = useState(comment.replies ?? []);
  const [showReplies, setShowReplies] = useState(false);
  const [replyBox, setReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const replyRef = useRef(null);

  const isOwner =
    currentUser && currentUser._id === (comment.author?._id ?? comment.author);
  const totalReplies = countReplies(replyTree);

  function countReplies(nodes) {
    return nodes.reduce(
      (acc, n) => acc + 1 + countReplies(n.children ?? []),
      0,
    );
  }

  const handleDirectReplySubmit = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await addReply(discussionId, comment._id, {
        content: replyText.trim(),
      });
      setReplyTree((p) => [...p, res.data.data]);
      setReplyText("");
      setReplyBox(false);
      setShowReplies(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewNestedReply = (parentReplyId, newReply) => {
    const insertInto = (nodes) =>
      nodes.map((n) => {
        if (n._id === parentReplyId) {
          return { ...n, children: [...(n.children ?? []), newReply] };
        }
        return { ...n, children: insertInto(n.children ?? []) };
      });
    setReplyTree((p) => insertInto(p));
    setShowReplies(true);
  };

  const handleDeleteReply = (replyId) => {
    const removeFrom = (nodes) =>
      nodes
        .filter((n) => n._id !== replyId)
        .map((n) => ({ ...n, children: removeFrom(n.children ?? []) }));
    setReplyTree((p) => removeFrom(p));
  };

  const handleUpvote = async () => {
    if (!currentUser) return;
    try {
      const res = await upvoteComment(discussionId, comment._id);
      setUpvotes(res.data.data.upvotes);
      setUpvoted(res.data.data.upvoted);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async () => {
    try {
      await acceptAnswer(discussionId, comment._id);
      onAccept(comment._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async () => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(discussionId, comment._id);
      onDelete(comment._id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className={`rounded-xl border p-4 ${
        comment.isAcceptedAnswer
          ? "border-emerald-200 bg-emerald-50/30"
          : "border-gray-100 bg-white"
      }`}
    >
      {comment.isAcceptedAnswer && (
        <div className="flex items-center gap-1.5 mb-3">
          <Check size={12} className="text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700">
            Accepted answer
          </span>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
          <button
            onClick={handleUpvote}
            className={`p-1 rounded-lg transition-colors ${
              upvoted
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:bg-gray-100"
            }`}
          >
            <ArrowUp size={13} />
          </button>
          <span className="text-xs font-semibold text-gray-700 tabular-nums">
            {upvotes}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Avatar user={comment.author} size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-800">
                  {comment.author?.firstName} {comment.author?.lastName}
                </span>
                {comment.author?.role === "superadmin" && (
                  <span className="text-xs px-1.5 py-px bg-gray-900 text-white rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {relativeTime(comment.createdAt)}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-3">
            {comment.content}
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            {currentUser && (
              <button
                onClick={() => {
                  setReplyBox((p) => !p);
                  setTimeout(() => replyRef.current?.focus(), 50);
                }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                <CornerDownRight size={11} /> Reply
              </button>
            )}

            {totalReplies > 0 && (
              <button
                onClick={() => {
                  setShowReplies((p) => !p);
                }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                {showReplies ? (
                  <ChevronUp size={11} />
                ) : (
                  <ChevronDown size={11} />
                )}
                {totalReplies} {totalReplies === 1 ? "reply" : "replies"}
              </button>
            )}

            {isDiscussionAuthor && !comment.isAcceptedAnswer && (
              <button
                onClick={handleAccept}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors"
              >
                <Check size={11} /> Accept
              </button>
            )}

            {(isOwner || currentUser?.role === "superadmin") && (
              <button
                onClick={handleDeleteComment}
                className="flex items-center gap-1 text-xs text-gray-300 hover:text-red-500 transition-colors ml-auto"
              >
                <Trash2 size={11} /> Delete
              </button>
            )}
          </div>

          {replyBox && (
            <div className="mt-3 flex gap-2">
              <input
                ref={replyRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleDirectReplySubmit();
                  }
                }}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-900 placeholder:text-gray-300 transition-all"
              />
              <button
                onClick={handleDirectReplySubmit}
                disabled={submitting || !replyText.trim()}
                className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                {submitting ? "..." : "Post"}
              </button>
              <button
                onClick={() => {
                  setReplyBox(false);
                  setReplyText("");
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {showReplies && replyTree.length > 0 && (
            <div className="mt-3">
              {replyTree.map((reply) => (
                <ReplyNode
                  key={reply._id}
                  reply={reply}
                  discussionId={discussionId}
                  commentId={comment._id}
                  currentUser={currentUser}
                  isDiscussionAuthor={isDiscussionAuthor}
                  depth={1}
                  onDeleteReply={handleDeleteReply}
                  onNewReply={handleNewNestedReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
export default function DiscussionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [discussion, setDiscussion] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upvotes, setUpvotes] = useState(0);
  const [upvoted, setUpvoted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  
  // ─── Refactored Comment Box State Management ───
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getDiscussionById(id);
        const { discussion: d, comments: c } = res.data.data;
        setDiscussion(d);
        setComments(c);
        setUpvotes(d.upvotes?.length ?? 0);
        setUpvoted(d.upvotes?.some((u) => (u._id ?? u) === user?._id) ?? false);
        setBookmarked(
          d.bookmarks?.some((u) => (u._id ?? u) === user?._id) ?? false,
        );
      } catch {
        setError("Discussion not found.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, user]);

  const handleUpvote = async () => {
    if (!user) return;
    try {
      const res = await upvoteDiscussion(id);
      setUpvotes(res.data.data.upvotes);
      setUpvoted(res.data.data.upvoted);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    try {
      const res = await bookmarkDiscussion(id);
      setBookmarked(res.data.data.bookmarked);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const res = await addComment(id, { content: commentText.trim() });
      setComments((p) => [...p, res.data.data]);
      setCommentText("");
      setIsFormExpanded(false); // Collapse form back down after successful post
      setDiscussion((d) => ({ ...d, commentCount: (d.commentCount ?? 0) + 1 }));
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = (commentId) =>
    setComments((p) => p.filter((c) => c._id !== commentId));

  const handleAcceptAnswer = (commentId) =>
    setComments((p) =>
      p.map((c) => ({ ...c, isAcceptedAnswer: c._id === commentId })),
    );

  const handleDelete = async () => {
    try {
      await deleteDiscussion(id);
    } catch (error) {
      console.log(error);
    } finally {
      navigate(-1);
    }
  };

  const isDiscussionAuthor =
    user &&
    discussion &&
    user._id === (discussion.author?._id ?? discussion.author);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (error || !discussion)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-gray-500">{error || "Not found."}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-900 underline underline-offset-2"
        >
          Go back
        </button>
      </div>
    );

  const acceptedAnswer = comments.find((c) => c.isAcceptedAnswer);

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link to="/discussions" className="hover:text-gray-700 transition-colors">
          Discussions
        </Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{discussion.title}</span>
      </div>

      {/* Discussion card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 relative">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryStyle[discussion.category] ?? categoryStyle.general}`}
            >
              {categoryLabel[discussion.category] ?? discussion.category}
            </span>
            {discussion.isPinned && (
              <span className="text-xs font-medium px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full">
                📌 Pinned
              </span>
            )}
            {discussion.isLocked && (
              <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full">
                🔒 Locked
              </span>
            )}
            {acceptedAnswer && (
              <span className="text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full flex items-center gap-1">
                <Check size={10} /> Answered
              </span>
            )}
          </div>

          {isDiscussionAuthor && user.role === "superadmin" && (
            <button
              onClick={handleDelete}
              className="p-1.5 text-gray-400 rounded-lg hover:text-red-600 hover:bg-red-50 transition-colors ml-auto"
              title="Delete Discussion"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        <h1 className="text-xl font-semibold text-gray-900 leading-tight mb-4">
          {discussion.title}
        </h1>

        <div className="flex items-center gap-2.5 mb-5">
          <Avatar user={discussion.author} size="md" />
          <div>
            <p className="text-sm font-medium text-gray-800">
              {discussion.author?.firstName} {discussion.author?.lastName}
            </p>
            <p className="text-xs text-gray-400">
              {discussion.author?.branch} · Year {discussion.author?.year} ·{" "}
              {relativeTime(discussion.createdAt)}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-5">
          {discussion.content}
        </p>

        {discussion.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {discussion.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                upvoted
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              <ArrowUp size={12} /> {upvotes} upvote{upvotes !== 1 ? "s" : ""}
            </button>
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                bookmarked
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              <Bookmark size={12} fill={bookmarked ? "currentColor" : "none"} />
              {bookmarked ? "Saved" : "Save"}
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{discussion.views ?? 0} views</span>
            <span>{discussion.commentCount ?? 0} replies</span>
          </div>
        </div>
      </div>

      {/* ─── NEW: Compact, Collapsible Inline Reply Form (Positioned Above Comments) ─── */}
      {user && !discussion.isLocked ? (
        <div className="mb-6 transition-all duration-200">
          {!isFormExpanded ? (
            // Collapsed trigger bar: matches standard UI elements nicely
            <div
              onClick={() => {
                setIsFormExpanded(true);
                setTimeout(() => textareaRef.current?.focus(), 50);
              }}
              className="flex items-center gap-2.5 px-4 py-3 bg-white border border-gray-100 rounded-xl cursor-pointer text-gray-400 hover:border-gray-300 hover:shadow-xs transition-all"
            >
              <PenSquare size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs font-medium">Write a thoughtful reply...</span>
            </div>
          ) : (
            // Expanded micro input card
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs">
              <form onSubmit={handlePostComment}>
                <textarea
                  ref={textareaRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  placeholder="Type your answer or perspective here..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-900 placeholder:text-gray-300 resize-none leading-relaxed transition-all mb-3"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormExpanded(false);
                      setCommentText("");
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={posting || !commentText.trim()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors"
                  >
                    {posting ? (
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Post reply"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : discussion.isLocked ? (
        <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 border border-gray-100 rounded-xl mb-6">
          <span className="text-xs text-gray-500">🔒 This discussion is locked.</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 border border-gray-100 rounded-xl mb-6">
          <Link to="/login" className="text-xs text-gray-900 font-medium hover:underline underline-offset-2">
            Sign in to reply
          </Link>
        </div>
      )}

      {/* List of Existing Comments */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          {comments.length > 0
            ? `${comments.length} ${comments.length === 1 ? "reply" : "replies"}`
            : "No replies yet"}
        </h2>

        {comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((c) => (
              <CommentBlock
                key={c._id}
                comment={c}
                discussionId={id}
                currentUser={user}
                isDiscussionAuthor={isDiscussionAuthor}
                onDelete={handleDeleteComment}
                onAccept={handleAcceptAnswer}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-white border border-gray-100 rounded-xl">
            <MessageSquare size={20} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              No replies yet. Be the first to respond.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}