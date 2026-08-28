import { useEffect, useState } from "react";
import { Loader2, FileText, ExternalLink, CheckCircle2, Clock } from "lucide-react";
import { listMyAssignments, submitAssignment } from "../../api/assignment.api";
import { uploadFile } from "../../api/upload.api";

const StudentAssignments = () => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [drafts, setDrafts] = useState({}); // id -> { text, file }
  const [submittingId, setSubmittingId] = useState(null);

  const load = async () => {
    const { data } = await listMyAssignments();
    setAssignments(data?.data?.assignments || []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const submit = async (id) => {
    const draft = drafts[id] || {};
    if (!draft.text && !draft.file) return;

    setSubmittingId(id);
    try {
      let fileUrl = "";
      if (draft.file) fileUrl = await uploadFile(draft.file, "assignment-submissions");
      await submitAssignment(id, { textAnswer: draft.text || "", fileUrl });
      await load();
    } finally {
      setSubmittingId(null);
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
        <h1 className="text-lg font-semibold text-gray-900">Assignments</h1>
        <p className="text-sm text-gray-500">Assignments from your teachers</p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <FileText size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No assignments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const submission = a.mySubmission;
            return (
              <div key={a._id} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    <p className="text-[11px] text-gray-400">
                      {a.subject} · {a.faculty?.firstName} {a.faculty?.lastName} · {a.maxMarks} marks
                    </p>
                  </div>
                  <span
                    className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                      a.isOverdue && !submission
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Clock size={11} />
                    Due {new Date(a.dueDate).toLocaleDateString([], { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{a.description}</p>
                {a.attachmentUrl && (
                  <a
                    href={a.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 mb-3"
                  >
                    <ExternalLink size={12} /> View attachment
                  </a>
                )}

                {submission ? (
                  <div className="bg-gray-50 rounded-lg px-3 py-2.5 flex items-center justify-between">
                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      Submitted {submission.isLate ? "(late)" : ""}
                    </p>
                    {submission.status === "graded" ? (
                      <span className="text-sm font-semibold text-gray-900">
                        {submission.marks}/{a.maxMarks}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Awaiting grade</span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      placeholder="Write your answer (optional if attaching a file)…"
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [a._id]: { ...prev[a._id], text: e.target.value } }))
                      }
                      className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [a._id]: { ...prev[a._id], file: e.target.files?.[0] || null },
                          }))
                        }
                        className="text-xs text-gray-500 flex-1"
                      />
                      <button
                        onClick={() => submit(a._id)}
                        disabled={submittingId === a._id}
                        className="text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg px-3 py-2 disabled:opacity-60"
                      >
                        {submittingId === a._id ? "Submitting…" : "Submit"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
