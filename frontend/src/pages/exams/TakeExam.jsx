import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Clock, CheckCircle2 } from "lucide-react";
import { startExam, submitExam } from "../../api/exam.api";

const formatClock = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exam, setExam] = useState(null);
  const [closesAt, setClosesAt] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> value
  const [remainingMs, setRemainingMs] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // { autoScore, needsManualGrading }
  const submittedRef = useRef(false);

  useEffect(() => {
    startExam(id)
      .then(({ data }) => {
        const payload = data?.data;
        setExam(payload?.exam || null);
        setClosesAt(payload?.closesAt ? new Date(payload.closesAt) : null);

        const initial = {};
        (payload?.submission?.answers || []).forEach((a) => {
          initial[a.question] = a.selectedOptionIndex ?? a.textAnswer ?? "";
        });
        setAnswers(initial);
      })
      .catch((err) => setError(err?.response?.data?.message || "Couldn't start this exam."))
      .finally(() => setLoading(false));
  }, [id]);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([questionId, value]) => {
        const question = exam.questions.find((q) => q._id === questionId);
        if (question?.type === "mcq") {
          return { questionId, selectedOptionIndex: value === "" ? null : Number(value) };
        }
        return { questionId, textAnswer: value };
      });
      const { data } = await submitExam(id, payload);
      setDone({
        autoScore: data?.data?.autoScore,
        needsManualGrading: data?.data?.needsManualGrading,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't submit — try again.");
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [answers, exam, id]);

  // Countdown timer — auto-submits when time runs out.
  useEffect(() => {
    if (!closesAt) return;
    const tick = () => {
      const remaining = closesAt.getTime() - Date.now();
      setRemainingMs(remaining);
      if (remaining <= 0) doSubmit();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [closesAt, doSubmit]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <CheckCircle2 size={30} className="text-emerald-500 mx-auto mb-3" />
        <p className="text-lg font-semibold text-gray-900">Exam submitted</p>
        <p className="text-sm text-gray-500 mt-1">
          {done.needsManualGrading
            ? "Your MCQ answers were graded automatically — the rest will be graded by your instructor."
            : `You scored ${done.autoScore}/${exam.totalMarks}.`}
        </p>
        <button
          onClick={() => navigate("/exams")}
          className="mt-5 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Back to exams
        </button>
      </div>
    );
  }

  const lowTime = remainingMs < 60_000;

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <div className="sticky top-0 bg-gray-50/95 backdrop-blur -mx-6 px-6 py-3 mb-5 flex items-center justify-between border-b border-gray-100 z-10">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">{exam.title}</h1>
          <p className="text-[11px] text-gray-400">{exam.subject}</p>
        </div>
        <span
          className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg ${
            lowTime ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-700"
          }`}
        >
          <Clock size={14} /> {formatClock(remainingMs)}
        </span>
      </div>

      {exam.instructions && (
        <p className="text-sm text-gray-500 bg-white border border-gray-100 rounded-xl p-3.5 mb-5">
          {exam.instructions}
        </p>
      )}

      <div className="space-y-4">
        {exam.questions.map((q, idx) => (
          <div key={q._id} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-sm text-gray-900 mb-3">
              <span className="text-gray-400 mr-1.5">{idx + 1}.</span>
              {q.text}
              <span className="text-[11px] text-gray-400 ml-2">({q.marks} marks)</span>
            </p>

            {q.type === "mcq" ? (
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className="flex items-center gap-2.5 text-sm text-gray-700 rounded-lg px-2.5 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={q._id}
                      checked={String(answers[q._id]) === String(oi)}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: oi }))}
                      className="accent-gray-900"
                    />
                    {opt.text}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[q._id] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q._id]: e.target.value }))}
                rows={4}
                placeholder="Write your answer…"
                className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <button
        onClick={doSubmit}
        disabled={submitting}
        className="w-full mt-5 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
      >
        {submitting ? "Submitting…" : "Submit exam"}
      </button>
    </div>
  );
};

export default TakeExam;
