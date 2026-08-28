import { useEffect, useState } from "react";
import { Loader2, FileCheck2, Check, X } from "lucide-react";
import { adminListPendingExams, adminApproveExam, adminRejectExam } from "../../api/exam.api";

const TestApproval = () => {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [reasonDrafts, setReasonDrafts] = useState({});

  const load = async () => {
    const { data } = await adminListPendingExams();
    setExams(data?.data?.exams || []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const approve = async (id) => {
    setBusyId(id);
    try {
      await adminApproveExam(id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    setBusyId(id);
    try {
      await adminRejectExam(id, reasonDrafts[id] || "");
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Test Approval</h1>
        <p className="text-sm text-gray-500">
          Tests only reach students after you approve them here.
        </p>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <FileCheck2 size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No tests waiting for review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div key={exam._id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <p className="text-sm font-medium text-gray-900">{exam.title}</p>
                  <p className="text-[11px] text-gray-400">
                    {exam.classroom?.className} · {exam.subject} · by {exam.faculty?.firstName}{" "}
                    {exam.faculty?.lastName}
                  </p>
                </div>
                <span className="text-[11px] text-gray-400 flex-shrink-0">
                  {exam.questions.length} questions · {exam.totalMarks} marks
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mb-3">
                Scheduled {new Date(exam.scheduledAt).toLocaleString([], {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {exam.durationMinutes} min
              </p>

              <div className="flex gap-2">
                <input
                  value={reasonDrafts[exam._id] || ""}
                  onChange={(e) => setReasonDrafts((prev) => ({ ...prev, [exam._id]: e.target.value }))}
                  placeholder="Reason if rejecting (optional)"
                  className="flex-1 text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
                <button
                  onClick={() => reject(exam._id)}
                  disabled={busyId === exam._id}
                  className="flex items-center gap-1 text-xs font-medium text-red-600 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 disabled:opacity-50"
                >
                  <X size={13} /> Reject
                </button>
                <button
                  onClick={() => approve(exam._id)}
                  disabled={busyId === exam._id}
                  className="flex items-center gap-1 text-xs font-medium text-white bg-gray-900 rounded-lg px-3 py-1.5 hover:bg-gray-800 disabled:opacity-50"
                >
                  <Check size={13} /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestApproval;
