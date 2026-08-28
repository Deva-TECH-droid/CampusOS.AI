import { useEffect, useState } from "react";
import { Loader2, Plus, BookOpen, Trash2, ExternalLink } from "lucide-react";
import { getMyAssignments } from "../../api/faculty.api";
import { listFacultyNotes, uploadNote, deleteNote } from "../../api/note.api";
import { uploadFile } from "../../api/upload.api";

const FacultyNotes = () => {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assignment: "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const { data } = await listFacultyNotes();
    setNotes(data?.data?.notes || []);
  };

  useEffect(() => {
    Promise.all([
      load(),
      getMyAssignments().then(({ data }) => {
        const list = data?.data?.assignments || [];
        setAssignments(list);
        if (list.length > 0) {
          setForm((f) => ({ ...f, assignment: `${list[0].classroom._id}::${list[0].subject}` }));
        }
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.assignment || !file) {
      setError("Title, class/subject and a file are required.");
      return;
    }
    const [classroom, subject] = form.assignment.split("::");
    setUploading(true);
    try {
      const fileUrl = await uploadFile(file, "notes");
      await uploadNote({ title: form.title, description: form.description, subject, classroom, fileUrl });
      setForm((f) => ({ ...f, title: "", description: "" }));
      setFile(null);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't upload note.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    await deleteNote(id);
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
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Notes &amp; Study Material</h1>
          <p className="text-sm text-gray-500">Upload material for your classes</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={15} /> Upload note
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2.5">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Note title"
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="Description (optional)"
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
          />
          <select
            value={form.assignment}
            onChange={(e) => setForm((f) => ({ ...f, assignment: e.target.value }))}
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            {assignments.map((a) => (
              <option key={`${a.classroom._id}::${a.subject}`} value={`${a.classroom._id}::${a.subject}`}>
                {a.classroom.className} · {a.subject}
              </option>
            ))}
          </select>
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
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      )}

      {notes.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <BookOpen size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No notes uploaded yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {notes.map((n) => (
            <div key={n._id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm text-gray-900 truncate">{n.title}</p>
                <p className="text-[11px] text-gray-400">{n.classroom?.className} · {n.subject}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <a href={n.fileUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900">
                  <ExternalLink size={14} />
                </a>
                <button onClick={() => remove(n._id)} className="text-gray-300 hover:text-red-500">
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

export default FacultyNotes;
