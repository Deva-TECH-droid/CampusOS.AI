import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { getMyAssignments } from "../../api/faculty.api";
import { createExam, submitForApproval } from "../../api/exam.api";

const blankMcq = () => ({
  type: "mcq",
  text: "",
  marks: 1,
  options: ["", ""],
  correctOptionIndex: 0,
});

const blankSubjective = () => ({
  type: "subjective",
  text: "",
  marks: 5,
});

const ExamBuilder = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    assignment: "", // "classroomId::subject"
    instructions: "",
    durationMinutes: 30,
    scheduledAt: "",
  });
  const [questions, setQuestions] = useState([blankMcq()]);

  useEffect(() => {
    getMyAssignments()
      .then(({ data }) => {
        const list = data?.data?.assignments || [];
        setAssignments(list);
        if (list.length > 0) {
          setForm((f) => ({ ...f, assignment: `${list[0].classroom._id}::${list[0].subject}` }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const updateQuestion = (idx, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = [...q.options];
        options[optIdx] = value;
        return { ...q, options };
      })
    );
  };

  const addOption = (qIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ""] } : q))
    );
  };

  const removeOption = (qIdx, optIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = q.options.filter((_, oi) => oi !== optIdx);
        const correctOptionIndex = Math.min(q.correctOptionIndex, options.length - 1);
        return { ...q, options, correctOptionIndex };
      })
    );
  };

  const removeQuestion = (idx) => setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  const submit = async (submitForReview) => {
    setError("");
    if (!form.title.trim() || !form.assignment || !form.scheduledAt) {
      setError("Title, class/subject and schedule time are required.");
      return;
    }
    if (questions.some((q) => !q.text.trim())) {
      setError("Every question needs text.");
      return;
    }
    if (
      questions.some(
        (q) => q.type === "mcq" && q.options.some((o) => !o.trim())
      )
    ) {
      setError("Every MCQ option needs text.");
      return;
    }

    const [classroom, subject] = form.assignment.split("::");
    setSaving(true);
    try {
      const { data } = await createExam({
        title: form.title,
        subject,
        classroom,
        instructions: form.instructions,
        durationMinutes: Number(form.durationMinutes),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        questions,
      });
      const examId = data?.data?.exam?._id;
      if (submitForReview && examId) {
        await submitForApproval(examId);
      }
      navigate(`/faculty/exams/${examId}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't save the exam.");
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">New exam</h1>
        <p className="text-sm text-gray-500">Build a test — MCQs auto-grade, subjective answers you grade by hand.</p>
      </div>

      {/* Exam meta */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Exam title (e.g. Unit Test 1 — Data Structures)"
          className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <select
            value={form.assignment}
            onChange={(e) => setForm((f) => ({ ...f, assignment: e.target.value }))}
            className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            {assignments.map((a) => (
              <option key={`${a.classroom._id}::${a.subject}`} value={`${a.classroom._id}::${a.subject}`}>
                {a.classroom.className} · {a.subject}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={form.durationMinutes}
            onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
            placeholder="Duration (min)"
            className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>
        <textarea
          value={form.instructions}
          onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
          placeholder="Instructions for students (optional)"
          rows={2}
          className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
        />
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Questions <span className="text-gray-400 font-normal">· {totalMarks} marks total</span>
          </h2>
        </div>

        {questions.map((q, idx) => (
          <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2.5">
            <div className="flex items-start gap-2">
              <GripVertical size={14} className="text-gray-300 mt-2.5 flex-shrink-0" />
              <textarea
                value={q.text}
                onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                placeholder={`Question ${idx + 1}`}
                rows={2}
                className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
              />
              <button
                onClick={() => removeQuestion(idx)}
                className="text-gray-300 hover:text-red-500 transition-colors mt-2"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {q.type === "mcq" ? (
              <div className="pl-6 space-y-1.5">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={q.correctOptionIndex === oi}
                      onChange={() => updateQuestion(idx, { correctOptionIndex: oi })}
                      className="accent-gray-900"
                    />
                    <input
                      value={opt}
                      onChange={(e) => updateOption(idx, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 text-sm rounded-lg border border-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                    {q.options.length > 2 && (
                      <button onClick={() => removeOption(idx, oi)} className="text-gray-300 hover:text-red-500">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addOption(idx)}
                  className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                  <Plus size={12} /> Add option
                </button>
                <p className="text-[11px] text-gray-400">Select the radio button next to the correct answer.</p>
              </div>
            ) : (
              <p className="pl-6 text-[11px] text-gray-400">
                Subjective — student writes a free-text answer, you grade it manually.
              </p>
            )}

            <div className="pl-6 flex items-center gap-2">
              <label className="text-xs text-gray-500">Marks</label>
              <input
                type="number"
                min={1}
                value={q.marks}
                onChange={(e) => updateQuestion(idx, { marks: e.target.value })}
                className="w-16 text-sm rounded-lg border border-gray-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            onClick={() => setQuestions((prev) => [...prev, blankMcq()])}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-600 border border-dashed border-gray-300 rounded-xl py-2.5 hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            <Plus size={14} /> Add MCQ
          </button>
          <button
            onClick={() => setQuestions((prev) => [...prev, blankSubjective()])}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-600 border border-dashed border-gray-300 rounded-xl py-2.5 hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            <Plus size={14} /> Add subjective question
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2.5">
        <button
          onClick={() => submit(false)}
          disabled={saving}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 transition-colors"
        >
          Save as draft
        </button>
        <button
          onClick={() => submit(true)}
          disabled={saving}
          className="flex-1 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Submit for admin approval
        </button>
      </div>
    </div>
  );
};

export default ExamBuilder;
