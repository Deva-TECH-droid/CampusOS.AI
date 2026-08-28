import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, FileText, Users, Clock, Trash2 } from "lucide-react";
import { getMyAssignments } from "../../api/faculty.api";
import {
  listFacultyAssignments,
  createAssignment,
  deleteAssignment,
} from "../../api/assignment.api";
import { uploadFile } from "../../api/upload.api";

const FacultyAssignments = () => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [teachAssignments, setTeachAssignments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignment: "",
    maxMarks: 10,
    dueDate: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const { data } = await listFacultyAssignments();
    setAssignments(data?.data?.assignments || []);
  };

  useEffect(() => {
    Promise.all([
      load(),
      getMyAssignments().then(({ data }) => {
        const list = data?.data?.assignments || [];
        setTeachAssignments(list);
        if (list.length > 0) {
          setForm((f) => ({ ...f, assignment: `${list[0].classroom._id}::${list[0].subject}` }));
        }
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.description || !form.assignment || !form.dueDate) {
      setError("Title, description, class/subject and due date are required.");
      return;
    }
    const [classroom, subject] = form.assignment.split("::");
    setUploading(true);
    try {
      let attachmentUrl = "";
      if (file) attachmentUrl = await uploadFile(file, "assignments");

      await createAssignment({
        title: form.title,
        description: form.description,
        subject,
        classroom,
        maxMarks: Number(form.maxMarks),
        dueDate: new Date(form.dueDate).toISOString(),
        attachmentUrl,
      });
      setForm((f) => ({ ...f, title: "", description: "", dueDate: "" }));
      setFile(null);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't create assignment.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    await deleteAssignment(id);
    await load();
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Assignments</h1>
          <p className="text-sm text-gray-500">Create assignments and grade submissions</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={15} /> New assignment
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2.5">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Assignment title"
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Instructions for students"
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <select
              value={form.assignment}
              onChange={(e) => setForm((f) => ({ ...f, assignment: e.target.value }))}
              className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              {teachAssignments.map((a) => (
                <option key={`${a.classroom._id}::${a.subject}`} value={`${a.classroom._id}::${a.subject}`}>
                  {a.classroom.className} · {a.subject}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={form.maxMarks}
              onChange={(e) => setForm((f) => ({ ...f, maxMarks: e.target.value }))}
              placeholder="Max marks"
              className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-xs text-gray-500"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {uploading ? "Saving…" : "Create assignment"}
          </button>
        </form>
      )}

      {assignments.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <FileText size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No assignments created yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {assignments.map((a) => (
            <div key={a._id} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <Link to={`/faculty/assignments/${a._id}`} className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                <p className="text-[11px] text-gray-400">
                  {a.classroom?.className} · {a.subject} · {a.maxMarks} marks
                </p>
              </Link>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Users size={12} /> {a.gradedCount}/{a.submittedCount} graded
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Clock size={12} />
                  {new Date(a.dueDate).toLocaleDateString([], { day: "numeric", month: "short" })}
                </span>
                <button onClick={() => remove(a._id)} className="text-gray-300 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyAssignments;
