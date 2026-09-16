import { useEffect, useState } from "react";
import { ShieldCheck, Check, X, Inbox, ExternalLink, Loader2 } from "lucide-react";
import {
  listPendingResources,
  verifyResource,
  deleteResource,
} from "../../api/competitive.api";

const ModerationQueue = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    listPendingResources()
      .then((res) => setPending(res.data?.data?.resources || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = (id) => setPending((p) => p.filter((r) => r._id !== id));

  const approve = async (id) => {
    setBusyId(id);
    try {
      await verifyResource(id);
      remove(id);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    if (!window.confirm("Reject and delete this submission?")) return;
    setBusyId(id);
    try {
      await deleteResource(id);
      remove(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-1.5">
          <ShieldCheck size={17} className="text-gray-400" /> Moderation Queue
        </h1>
        <p className="text-sm text-gray-500">
          Community-submitted Competitive Prep resources awaiting review.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="animate-spin text-gray-300" size={22} />
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <Inbox size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Nothing pending review.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {pending.map((r) => (
            <div
              key={r._id}
              className="bg-white border border-gray-100 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.category} · {r.type}
                    {r.platform ? ` · ${r.platform}` : ""}
                  </p>
                  {r.description && (
                    <p className="text-xs text-gray-500 mt-1">{r.description}</p>
                  )}
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 flex items-center gap-1 mt-1.5"
                  >
                    <ExternalLink size={11} /> {r.url}
                  </a>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Submitted by {r.submittedBy?.firstName} {r.submittedBy?.lastName}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => reject(r._id)}
                    disabled={busyId === r._id}
                    className="flex items-center gap-1 text-xs font-medium text-red-600 border border-red-100 rounded-lg px-2.5 py-1.5 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X size={12} /> Reject
                  </button>
                  <button
                    onClick={() => approve(r._id)}
                    disabled={busyId === r._id}
                    className="flex items-center gap-1 text-xs font-medium text-white bg-gray-900 rounded-lg px-2.5 py-1.5 hover:bg-gray-800 disabled:opacity-50"
                  >
                    <Check size={12} /> Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModerationQueue;