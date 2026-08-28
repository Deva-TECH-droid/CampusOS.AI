import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, Plus, ChevronRight } from "lucide-react";
import {
  getNotices,
  togglePinNotice,
  archiveNotice,
  deleteNotice,
} from "../../api/notice.api";
import NoticeCard from "./NoticeCard";
import useAuth from "../../hooks/useAuth";

const CompactSkeleton = () => (
  <div className="animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <div
            className="h-2.5 bg-gray-100 rounded"
            style={{ width: `${50 + i * 15}%` }}
          />
          <div className="h-2 bg-gray-100 rounded w-1/4" />
        </div>
        <div className="w-4 h-2 bg-gray-100 rounded" />
      </div>
    ))}
  </div>
);

const FullSkeleton = () => (
  <div className="space-y-2 animate-pulse">
    {[...Array(2)].map((_, i) => (
      <div
        key={i}
        className="border border-gray-100 rounded-xl p-3.5 flex gap-3"
      >
        <div className="w-6 h-6 bg-gray-100 rounded-md flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-2 bg-gray-100 rounded w-1/4" />
          <div className="h-3 bg-gray-100 rounded w-3/4" />
          <div className="h-2.5 bg-gray-100 rounded" />
        </div>
      </div>
    ))}
  </div>
);

const NoticeFeed = ({
  targetType,
  targetId,
  canPost = false,
  showActions = false,
  title = "Notices",
  compact = false, // Layout styling flag only now
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getNotices({
        targetType,
        targetId: targetId || undefined,
      });
      // Backend now naturally returns a max of 5 unexpired notices sorted by priority
      setNotices(res.data.data.notices);
    } catch {
      setError("Failed to load notices.");
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleRemove = (id) => setNotices((p) => p.filter((n) => n._id !== id));
  const handlePin = async (id) => {
    await togglePinNotice(id);
  };
  const handleArchive = async (id) => {
    if (!window.confirm("Archive?")) return;
    await archiveNotice(id);
    handleRemove(id);
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete permanently?")) return;
    await deleteNotice(id);
    handleRemove(id);
  };

  const urgentCount = notices.filter(
    (n) => n.priority === "urgent" || n.priority === "high",
  ).length;
  const createPath = `/notices/create?category=${targetType}${targetId ? `&${targetType}=${targetId}` : ""}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {urgentCount > 0 ? (
            <BellRing size={13} className="text-red-500" />
          ) : (
            <Bell size={13} className="text-gray-400" />
          )}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {!loading && notices.length > 0 && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full
              ${urgentCount > 0 ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}
            >
              {urgentCount > 0
                ? `${urgentCount} alert${urgentCount > 1 ? "s" : ""}`
                : notices.length}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        compact ? (
          <CompactSkeleton />
        ) : (
          <FullSkeleton />
        )
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : notices.length > 0 ? (
        <>
          <div className={compact ? "" : "space-y-2"}>
            {notices.map((notice) => {
              const isOwner =
                user?._id === (notice.createdBy?._id ?? notice.createdBy);
              const canManage =
                showActions && (isOwner || user?.role === "superadmin");
              return (
                <NoticeCard
                  key={notice._id}
                  notice={notice}
                  compact={compact}
                  canManage={canManage}
                  onPin={handlePin}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-400">No notices yet.</p>
      )}
    </div>
  );
};

export default NoticeFeed;
