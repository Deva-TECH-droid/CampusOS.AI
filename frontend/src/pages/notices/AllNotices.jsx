import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Plus, Loader2, Inbox } from "lucide-react";
import {
  getNotices,
  togglePinNotice,
  archiveNotice,
  deleteNotice,
} from "../../api/notice.api";
import NoticeCard from "../../components/cards/NoticeCard";
import useAuth from "../../hooks/useAuth";

// Each tab maps directly to a query mode the backend already supports --
// no new backend query logic needed beyond the pagination just added.
const TABS = [
  { key: "dashboard", label: "All" },
  { key: "platform", label: "Platform" },
  { key: "classroom", label: "My Classroom" },
  { key: "community", label: "Community" },
  { key: "career", label: "Placements" },
];

const PAGE_SIZE = 10;

const AllNotices = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notices, setNotices] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const buildParams = useCallback(
    (targetPage) => {
      const params = { limit: PAGE_SIZE, page: targetPage };
      if (activeTab === "classroom") {
        params.targetType = "classroom";
        params.targetId = user?.classroom || undefined;
      } else {
        params.targetType = activeTab;
      }
      return params;
    },
    [activeTab, user?.classroom],
  );

  const load = useCallback(
    async (targetPage, append) => {
      append ? setLoadingMore(true) : setLoading(true);
      setError("");
      try {
        const { data } = await getNotices(buildParams(targetPage));
        const fetched = data?.data?.notices || [];
        setNotices((prev) => (append ? [...prev, ...fetched] : fetched));
        setHasMore(Boolean(data?.data?.pagination?.hasMore));
        setPage(targetPage);
      } catch {
        setError("Failed to load notices.");
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [buildParams],
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const handleRemove = (id) => setNotices((p) => p.filter((n) => n._id !== id));
  const handlePin = async (id) => togglePinNotice(id);
  const handleArchive = async (id) => {
    if (!window.confirm("Archive this notice?")) return;
    await archiveNotice(id);
    handleRemove(id);
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notice permanently?")) return;
    await deleteNotice(id);
    handleRemove(id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-1.5">
            <Bell size={17} className="text-gray-400" /> Notices
          </h1>
          <p className="text-sm text-gray-500">
            Everything relevant to you, in one place.
          </p>
        </div>
        {user?.role === "superadmin" && (
          <Link
            to="/create-notice"
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-gray-900 rounded-xl px-3.5 py-2 hover:bg-gray-800 transition-colors"
          >
            <Plus size={13} /> Platform notice
          </Link>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap border-b border-gray-100 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              activeTab === tab.key
                ? "bg-gray-900 text-white"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="animate-spin text-gray-300" size={22} />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : notices.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <Inbox size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No notices here yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notices.map((notice) => {
            const isOwner =
              user?._id === (notice.createdBy?._id ?? notice.createdBy);
            const canManage = isOwner || user?.role === "superadmin";
            return (
              <NoticeCard
                key={notice._id}
                notice={notice}
                canManage={canManage}
                onPin={handlePin}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            );
          })}
          {hasMore && (
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => load(page + 1, true)}
                disabled={loadingMore}
                className="text-xs font-medium text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllNotices;