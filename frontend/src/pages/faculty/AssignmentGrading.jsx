import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { getSubmissions, gradeSubmission } from "../../api/assignment.api";

const AssignmentGrading = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    const { data } = await getSubmissions(id);
    setAssignment(data?.data?.assignment || null);
    setSubmissions(data?.data?.submissions || []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async (submissionId) => {
    const draft = drafts[submissionId];
    if (!draft) return;
    setSavingId(submissionId);
    try {
      await gradeSubmission(submissionId, {
        marks: Number(draft.marks),
        feedback: draft.feedback || "",
      });
      await load();
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }
  if (!assignment) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{assignment.title}</h1>
        <p className="text-sm text-gray-500">
          {assignment.subject} · Max {assignment.maxMarks} marks · Due{" "}
          {new Date(assignment.dueDate).toLocaleDateString([], { day: "numeric", month: "short" })}
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500">No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div key={s._id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {s.student?.firstName} {s.student?.lastName}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {s.student?.rollNumber} · {s.isLate ? "Late" : "On time"} ·{" "}
                    {new Date(s.submittedAt).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {s.status === "graded" && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 size={13} /> {s.marks}/{assignment.maxMarks}
                  </span>
                )}
              </div>

              {s.textAnswer && (
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 mb-2 whitespace-pre-wrap">
                  {s.textAnswer}
                </p>
              )}
              {s.fileUrl && (
                <a
                  href={s.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 mb-2"
                >
                  <ExternalLink size={12} /> View submitted file
                </a>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={assignment.maxMarks}
                  defaultValue={s.marks ?? ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [s._id]: { ...prev[s._id], marks: e.target.value },
                    }))
                  }
                  placeholder="Marks"
                  className="w-20 text-sm rounded-lg border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
                <input
                  defaultValue={s.feedback}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [s._id]: { ...prev[s._id], feedback: e.target.value },
                    }))
                  }
                  placeholder="Feedback (optional)"
                  className="flex-1 text-sm rounded-lg border border-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
                <button
                  onClick={() => save(s._id)}
                  disabled={savingId === s._id}
                  className="text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg px-3 py-1.5 disabled:opacity-60"
                >
                  {savingId === s._id ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentGrading;
