import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, CheckCircle2, Send, TrendingDown } from "lucide-react";
import { getExamSubmissions, gradeSubmission, publishResults, getClassAnalytics } from "../../api/exam.api";

const ExamGrading = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [drafts, setDrafts] = useState({}); // submissionId -> { questionId: marks }
  const [savingId, setSavingId] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [analytics, setAnalytics] = useState(null);

  const load = async () => {
    const { data } = await getExamSubmissions(id);
    setExam(data?.data?.exam || null);
    setSubmissions(data?.data?.submissions || []);
    const analyticsRes = await getClassAnalytics(id);
    setAnalytics(analyticsRes?.data?.data?.analytics || null);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setDraftMark = (submissionId, questionId, value) => {
    setDrafts((prev) => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], [questionId]: value },
    }));
  };

  const saveGrades = async (submission) => {
    const draft = drafts[submission._id] || {};
    const marks = Object.entries(draft).map(([questionId, awardedMarks]) => ({
      questionId,
      awardedMarks: Number(awardedMarks),
    }));
    if (marks.length === 0) return;

    setSavingId(submission._id);
    try {
      await gradeSubmission(submission._id, marks);
      await load();
    } finally {
      setSavingId(null);
    }
  };

  const doPublish = async () => {
    setPublishing(true);
    setMessage("");
    try {
      await publishResults(id);
      setMessage("Results published — students can now see their marks.");
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Couldn't publish results.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }

  if (!exam) return null;

  const subjectiveQuestions = exam.questions.filter((q) => q.type === "subjective");
  const gradedCount = submissions.filter((s) => s.status === "graded").length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{exam.title}</h1>
          <p className="text-sm text-gray-500">
            {exam.classroom?.className} · {exam.subject} · {exam.totalMarks} marks ·{" "}
            {gradedCount}/{submissions.length} graded
          </p>
        </div>
        <button
          onClick={doPublish}
          disabled={publishing || exam.resultsPublished}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {exam.resultsPublished ? "Published" : "Publish results"}
        </button>
      </div>

      {message && <p className="text-sm text-gray-500">{message}</p>}

      {analytics && analytics.attemptCount > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-900">Class performance</h2>
            <span className="text-sm font-semibold text-gray-900">
              {analytics.averagePercentage}% avg
            </span>
          </div>
          {analytics.weakestTopics.length > 0 && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5 mb-2">
              <TrendingDown size={13} /> Weakest topics: {analytics.weakestTopics.join(", ")}
            </p>
          )}
          <div className="space-y-1.5">
            {analytics.classTopicBreakdown.map((t) => (
              <div key={t.topic} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-28 truncate flex-shrink-0">{t.topic}</span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${t.accuracy >= 70 ? "bg-emerald-500" : t.accuracy >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">{t.accuracy}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500">No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div key={submission._id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {submission.student
                      ? `${submission.student.firstName} ${submission.student.lastName}`
                      : "—"}
                  </p>
                  <p className="text-[11px] text-gray-400">{submission.student?.rollNumber}</p>
                </div>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    submission.status === "graded"
                      ? "bg-emerald-50 text-emerald-600"
                      : submission.status === "pending_review"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {submission.status === "in_progress"
                    ? "Not submitted"
                    : submission.finalScore != null
                    ? `${submission.finalScore}/${exam.totalMarks}`
                    : submission.status.replace("_", " ")}
                </span>
              </div>

              {submission.status !== "in_progress" && subjectiveQuestions.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-gray-50">
                  {subjectiveQuestions.map((q) => {
                    const answer = submission.answers.find(
                      (a) => a.question.toString() === q._id.toString()
                    );
                    return (
                      <div key={q._id} className="text-sm">
                        <p className="text-gray-600 text-xs mb-1">{q.text}</p>
                        <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2 text-sm mb-1.5 whitespace-pre-wrap">
                          {answer?.textAnswer || <span className="text-gray-400">No answer</span>}
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={q.marks}
                            defaultValue={answer?.awardedMarks ?? ""}
                            onChange={(e) => setDraftMark(submission._id, q._id, e.target.value)}
                            className="w-20 text-sm rounded-lg border border-gray-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
                            placeholder="0"
                          />
                          <span className="text-xs text-gray-400">/ {q.marks} marks</span>
                          {answer?.awardedMarks != null && (
                            <CheckCircle2 size={13} className="text-emerald-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => saveGrades(submission)}
                    disabled={savingId === submission._id}
                    className="text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg px-3 py-1.5 disabled:opacity-60"
                  >
                    {savingId === submission._id ? "Saving…" : "Save grades"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamGrading;
