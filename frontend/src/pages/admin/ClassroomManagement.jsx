import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  School,
  CalendarClock,
  ChevronDown,
  Users,
  Edit2,
  X,
  Check,
  BookOpen,
} from "lucide-react";
import {
  adminListAllClassrooms,
  adminCreateClassroom,
  adminUpdateClassroom,
  adminDeleteClassroom,
  adminGetClassroomStudents,
  adminAddPeriod,
  adminUpdatePeriod,
  adminRemovePeriod,
} from "../../api/classroom.api";
import { BRANCHES } from "../../constants/branches.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SAMPLE_CLASSES = ["B2 - 005", "B2 - 223", "B3 - 101", "CSE - A", "CSE - B"];

const CreateClassroomForm = ({ onCreated }) => {
  const [form, setForm] = useState({ className: "", branch: "CSE", year: 1, section: "A" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.className.trim() || !form.branch) {
      setError("Class name and branch are required.");
      return;
    }
    setSubmitting(true);
    try {
      await adminCreateClassroom(form);
      setForm({ className: "", branch: "CSE", year: 1, section: "A" });
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't create classroom.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <Plus size={16} className="text-emerald-600" /> Create Classroom
        </h2>
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400">Quick fill:</span>
          {SAMPLE_CLASSES.slice(0, 3).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setForm((f) => ({ ...f, className: name }))}
              className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <input
        value={form.className}
        onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
        placeholder="Class name (e.g. B2 - 005 or CSE - A)"
        className="w-full text-xs rounded-xl border border-gray-200 px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <select
          value={form.branch}
          onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
          className="text-xs rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
        >
          {BRANCHES.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={4}
          value={form.year}
          onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
          placeholder="Year"
          className="text-xs rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        <input
          value={form.section}
          onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
          placeholder="Section (e.g. A or 005)"
          className="text-xs rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-60 transition-colors shadow-sm"
      >
        {submitting ? "Creating…" : "Create Classroom"}
      </button>
    </form>
  );
};

const PeriodForm = ({ classroomId, onAdded }) => {
  const [form, setForm] = useState({
    day: "Monday",
    subject: "Java",
    faculty: "",
    room: "B2 - 005",
    startTime: "08:00",
    endTime: "09:00",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.subject.trim() || !form.faculty.trim() || !form.startTime || !form.endTime) {
      setError("Subject, faculty, and timings are required.");
      return;
    }
    setSubmitting(true);
    try {
      await adminAddPeriod(classroomId, form);
      setForm((f) => ({ ...f, subject: "", faculty: "" }));
      onAdded();
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't add period.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-gray-50 border border-gray-200/70 rounded-xl p-3 space-y-2.5">
      <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
        <Plus size={13} /> Add Timetable Period
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select
          value={form.day}
          onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}
          className="text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white"
        >
          {DAYS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <input
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="Subject (e.g. Java)"
          className="text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white"
        />
        <input
          value={form.faculty}
          onChange={(e) => setForm((f) => ({ ...f, faculty: e.target.value }))}
          placeholder="Teacher (e.g. Mr. Devansh)"
          className="text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white"
        />
        <input
          value={form.room}
          onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
          placeholder="Room (e.g. B2-005)"
          className="text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-500">From:</span>
        <input
          type="time"
          value={form.startTime}
          onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
          className="text-xs rounded-lg border border-gray-200 px-2 py-1 bg-white"
        />
        <span className="text-[11px] text-gray-500">To:</span>
        <input
          type="time"
          value={form.endTime}
          onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
          className="text-xs rounded-lg border border-gray-200 px-2 py-1 bg-white"
        />
        <button
          type="submit"
          disabled={submitting}
          className="ml-auto px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Adding…" : "Add Period"}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </form>
  );
};

const ClassroomCard = ({ classroom, onChanged, onViewStudents, onEdit }) => {
  const [expanded, setExpanded] = useState(false);

  const remove = async () => {
    if (!window.confirm(`Delete classroom "${classroom.className}"?`)) return;
    await adminDeleteClassroom(classroom._id);
    onChanged();
  };

  const removePeriod = async (day, index) => {
    await adminRemovePeriod(classroom._id, day, index);
    onChanged();
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all">
      <div className="p-4 flex items-center justify-between">
        <div
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-3 cursor-pointer flex-1"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
            <School size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              {classroom.className}
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {classroom.branch} · Year {classroom.year}
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {classroom.studentCount} enrolled student(s)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onViewStudents(classroom)}
            className="p-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1 font-medium border border-gray-200"
            title="View Enrolled Students"
          >
            <Users size={14} className="text-indigo-600" />
            <span className="hidden sm:inline">Students</span>
          </button>
          <button
            onClick={() => onEdit(classroom)}
            className="p-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1 font-medium border border-gray-200"
            title="Edit Classroom Details"
          >
            <Edit2 size={13} />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-gray-400 hover:text-gray-700"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3 bg-gray-50/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <CalendarClock size={14} className="text-indigo-600" />
              Class Timetable Schedule
            </p>
            <button
              onClick={remove}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
            >
              <Trash2 size={12} /> Delete Classroom
            </button>
          </div>

          {DAYS.map((day) => {
            const periods = classroom.timetable?.[day] || [];
            if (periods.length === 0) return null;
            return (
              <div key={day} className="bg-white p-2.5 rounded-xl border border-gray-100">
                <p className="text-[11px] font-bold text-gray-600 mb-1.5">{day}</p>
                <div className="space-y-1">
                  {periods.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2.5 py-1.5"
                    >
                      <span className="text-gray-800 font-medium">
                        {p.subject} · {p.faculty} · {p.startTime}–{p.endTime} {p.room ? `(${p.room})` : ""}
                      </span>
                      <button
                        onClick={() => removePeriod(day, i)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <PeriodForm classroomId={classroom._id} onAdded={onChanged} />
        </div>
      )}
    </div>
  );
};

export default function ClassroomManagement() {
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState([]);

  // Students view modal
  const [viewingClass, setViewingClass] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Edit classroom modal
  const [editingClass, setEditingClass] = useState(null);
  const [editForm, setEditForm] = useState({ className: "", branch: "", year: 1, section: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async () => {
    const { data } = await adminListAllClassrooms();
    setClassrooms(data?.data?.classrooms || []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleOpenStudents = async (cls) => {
    setViewingClass(cls);
    setLoadingStudents(true);
    try {
      const { data } = await adminGetClassroomStudents(cls._id);
      setEnrolledStudents(data?.data?.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenEdit = (cls) => {
    setEditingClass(cls);
    setEditForm({
      className: cls.className,
      branch: cls.branch,
      year: cls.year,
      section: cls.section || "",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.className.trim()) return;
    setSavingEdit(true);
    try {
      await adminUpdateClassroom(editingClass._id, editForm);
      setEditingClass(null);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update classroom.");
    } finally {
      setSavingEdit(false);
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Classroom Management</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Add and configure classes, manage faculty assignments, timetable periods, and enrolled students
        </p>
      </div>

      <CreateClassroomForm onCreated={load} />

      {classrooms.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <School size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No classrooms created yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classrooms.map((c) => (
            <ClassroomCard
              key={c._id}
              classroom={c}
              onChanged={load}
              onViewStudents={handleOpenStudents}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      )}

      {/* Enrolled Students Modal */}
      {viewingClass && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" />
                  Enrolled Students — {viewingClass.className}
                </h3>
                <p className="text-[11px] text-gray-400">
                  {enrolledStudents.length} student(s) currently registered
                </p>
              </div>
              <button
                onClick={() => setViewingClass(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 pr-1">
              {loadingStudents ? (
                <div className="py-12 flex justify-center">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
              ) : enrolledStudents.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-10">
                  No students enrolled in this class yet.
                </p>
              ) : (
                enrolledStudents.map((st) => (
                  <div key={st._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {st.firstName} {st.lastName}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {st.rollNumber} {st.email ? `· ${st.email}` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {st.branch} · Year {st.year}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Classroom Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Edit2 size={14} /> Edit Classroom
              </h3>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">Class Name</label>
              <input
                value={editForm.className}
                onChange={(e) => setEditForm((f) => ({ ...f, className: e.target.value }))}
                className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">Branch</label>
              <select
                value={editForm.branch}
                onChange={(e) => setEditForm((f) => ({ ...f, branch: e.target.value }))}
                className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2 bg-white"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={editForm.year}
                  onChange={(e) => setEditForm((f) => ({ ...f, year: e.target.value }))}
                  className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Section</label>
                <input
                  value={editForm.section}
                  onChange={(e) => setEditForm((f) => ({ ...f, section: e.target.value }))}
                  className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-4 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {savingEdit ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}