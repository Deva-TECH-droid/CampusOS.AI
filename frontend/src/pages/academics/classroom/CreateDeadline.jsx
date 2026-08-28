import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Plus, AlertTriangle } from "lucide-react";
import { getClassroom, saveDeadline } from "../../../api/classroom.api";

// ─── Config ───────────────────────────────────────────────────
const TYPES = [
  { value: "assignment", label: "Assignment", color: "bg-blue-50 text-blue-700 border-blue-200",   activeRing: "ring-blue-200" },
  { value: "quiz",       label: "Quiz",       color: "bg-purple-50 text-purple-700 border-purple-200", activeRing: "ring-purple-200" },
  { value: "exam",       label: "Exam",       color: "bg-red-50 text-red-700 border-red-200",      activeRing: "ring-red-200" },
  { value: "lab",        label: "Lab",        color: "bg-green-50 text-green-700 border-green-200",activeRing: "ring-green-200" },
  { value: "project",    label: "Project",    color: "bg-amber-50 text-amber-700 border-amber-200",activeRing: "ring-amber-200" },
];

const MAX_TITLE = 120;
const MAX_DESC  = 1000;

const isUrgent = (dateStr) => {
  if (!dateStr) return false;
  const diff = new Date(dateStr) - new Date();
  return diff > 0 && diff < 48 * 60 * 60 * 1000;
};

const toDatetimeLocal = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toISOString().slice(0, 16);
};

// ─── Field Components ─────────────────────────────────────────
const FieldError = ({ message }) =>
  message ? <p className="mt-1.5 text-xs text-red-500">{message}</p> : null;

// ─── Main ─────────────────────────────────────────────────────
export default function CreateDeadline() {
  const { classroomId, deadlineId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Edit mode — deadline passed via router state
  const existingDeadline = location.state?.deadline || null;
  const isEdit = !!deadlineId || !!existingDeadline;

  useEffect(()=>{
    const fetchData=async()=>{
      const payload= await getClassroom()
      if(!payload.data.data.isClassRep){
        navigate(-1);
      }
    };
    fetchData();
  },[])

  const [form, setForm] = useState({
    title:       existingDeadline?.title       || "",
    description: existingDeadline?.description || "",
    type:        existingDeadline?.type        || "",
    dueDate:     existingDeadline?.dueDate ? toDatetimeLocal(existingDeadline.dueDate) : "",
  });
  const [errors,      setErrors]      = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading,     setLoading]     = useState(false);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "" }));
    setSubmitError("");
  };

  const selectType = (value) => {
    setForm(p => ({ ...p, type: value }));
    setErrors(p => ({ ...p, type: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())     e.title   = "Title is required.";
    else if (form.title.length > MAX_TITLE) e.title = `Max ${MAX_TITLE} characters.`;
    if (!form.type)             e.type    = "Select a deadline type.";
    if (!form.dueDate)          e.dueDate = "Due date is required.";
    else if (!isEdit && new Date(form.dueDate) < new Date()) e.dueDate = "Due date must be in the future.";
    if (form.description.length > MAX_DESC) e.description = `Max ${MAX_DESC} characters.`;
    return e;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  const errs = validate();
  if (Object.keys(errs).length) { setErrors(errs); return; }

  setLoading(true);
  setSubmitError("");

  const payload = {
    title:   form.title.trim(),
    type:    form.type,
    dueDate: new Date(form.dueDate).toISOString(),
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
  };

  try {
    // Determine the ID inline: pass the explicit ID if editing, or an empty string if creating
    const targetId = isEdit ? (deadlineId || existingDeadline?._id) : "";
    
    // Fire the single unified API request
    await saveDeadline(classroomId, targetId, payload);
    
    navigate(`/academics/classroom/${classroomId}`, {
      state: { toast: isEdit ? "Deadline updated." : "Deadline added." },
    });
  } catch (err) {
    setSubmitError(err.response?.data?.message || "Something went wrong. Try again.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const titleLeft = MAX_TITLE - form.title.length;
  const descLeft  = MAX_DESC  - form.description.length;
  const minDate   = new Date(Date.now() + 60000).toISOString().slice(0, 16);
  const selectedType = TYPES.find(t => t.value === form.type);

  return (
    <div className="max-w-2xl mx-auto">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEdit ? "Edit Deadline" : "Add Deadline"}
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {isEdit
            ? "Update the deadline details below."
            : "Students in this classroom will see this in their schedule."
          }
        </p>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-4">
          <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* ── Type selector ── */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <label className="block text-xs font-medium text-gray-700 mb-3">
            Type <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => selectType(t.value)}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all duration-150
                  ${form.type === t.value
                    ? `${t.color} ring-2 ${t.activeRing}`
                    : "border-gray-200 text-gray-500 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <span className="text-sm">{
                  t.value === "assignment" ? "📄" :
                  t.value === "quiz"       ? "✏️" :
                  t.value === "exam"       ? "📋" :
                  t.value === "lab"        ? "🔬" : "🗂️"
                }</span>
                {t.label}
              </button>
            ))}
          </div>
          <FieldError message={errors.type} />
        </div>

        {/* ── Title ── */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-700">
              Title <span className="text-red-400">*</span>
            </label>
            <span className={`text-xs tabular-nums ${titleLeft < 20 ? "text-amber-500" : "text-gray-300"}`}>
              {titleLeft} left
            </span>
          </div>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            maxLength={MAX_TITLE}
            placeholder={
              form.type === "exam"       ? "e.g. Mid-semester exam — Unit 1–4" :
              form.type === "quiz"       ? "e.g. Quiz 3 — Sorting algorithms" :
              form.type === "assignment" ? "e.g. Assignment 2 — Linked lists" :
              form.type === "lab"        ? "e.g. Lab 5 — RC circuit analysis" :
              form.type === "project"    ? "e.g. Mini project submission" :
              "Enter a clear, descriptive title"
            }
            className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 transition-all placeholder:text-gray-300
              ${errors.title
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-gray-400 focus:ring-gray-100"
              }`}
          />
          <FieldError message={errors.title} />
        </div>

        {/* ── Due date ── */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Due date &amp; time <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            min={isEdit ? undefined : minDate}
            className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 transition-all
              ${errors.dueDate
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-gray-400 focus:ring-gray-100"
              }`}
          />
          <FieldError message={errors.dueDate} />
          {isUrgent(form.dueDate) && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-600">Within 48 hours — students will see an urgent flag.</p>
            </div>
          )}
        </div>

        {/* ── Description ── */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-700">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <span className={`text-xs tabular-nums ${descLeft < 100 ? "text-amber-500" : "text-gray-300"}`}>
              {descLeft} left
            </span>
          </div>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            maxLength={MAX_DESC}
            rows={4}
            placeholder="Add instructions, weightage, or submission details students should know..."
            className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 transition-all placeholder:text-gray-300 resize-none leading-relaxed
              ${errors.description
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-gray-400 focus:ring-gray-100"
              }`}
          />
          <FieldError message={errors.description} />
        </div>

        {/* ── Live preview ── */}
        {(form.title || form.type) && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-400 mb-3">Preview</p>
            <div className="flex items-start gap-3">
              {selectedType && (
                <span className={`mt-0.5 text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${selectedType.color}`}>
                  {selectedType.label}
                </span>
              )}
              <div className="min-w-0 flex-1">
                {form.title && (
                  <p className="text-sm font-semibold text-gray-900 truncate">{form.title}</p>
                )}
                {form.dueDate && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Due {new Date(form.dueDate).toLocaleString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                    {isUrgent(form.dueDate) && (
                      <span className="ml-2 text-amber-600 font-medium">⚡ Urgent</span>
                    )}
                  </p>
                )}
                {form.description && (
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                    {form.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isEdit ? "Saving..." : "Adding..."}
              </>
            ) : (
              isEdit ? "Save Changes" : "Add Deadline"
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
