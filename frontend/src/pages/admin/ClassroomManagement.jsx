import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, School, CalendarClock, ChevronDown } from "lucide-react";
import {
  adminListAllClassrooms,
  adminCreateClassroom,
  adminDeleteClassroom,
  adminAddPeriod,
  adminRemovePeriod,
} from "../../api/classroom.api";
import { BRANCHES } from "../../constants/branches.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CreateClassroomForm = ({ onCreated }) => {
  const [form, setForm] = useState({ className: "", branch: "", year: 1, section: "" });
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
      setForm({ className: "", branch: "", year: 1, section: "" });
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't create classroom.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2.5">
      <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
        <Plus size={15} /> Create classroom
      </h2>
      <input
        value={form.className}
        onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
        placeholder="Class name (e.g. CSE-3A)"
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <select
          value={form.branch}
          onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
          className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
        >
          <option value="">Select branch</option>
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
          className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <input
          value={form.section}
          onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
          placeholder="Section (e.g. A)"
          className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
      >
        {submitting ? "Creating…" : "Create classroom"}
      </button>
    </form>
  );
};

const PeriodForm = ({ classroomId, onAdded }) => {
  const [form, setForm] = useState({
    day: "Monday",
    subject: "",
    faculty: "",
    room: "",
    startTime: "09:00",
    endTime: "10:00",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.subject.trim() || !form.faculty.trim()) {
      setError("Subject and faculty name are required.");
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
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <select
          value={form.day}
          onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}
          className="text-xs rounded-lg border border-gray-200 px-2 py-1.5 bg-white"
        >
          {DAYS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <input
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="Subject"
          className="text-xs rounded-lg border border-gray-200 px-2 py-1.5"
        />
        <input
          value={form.faculty}
          onChange={(e) => setForm((f) => ({ ...f, faculty: e.target.value }))}
          placeholder="Faculty name"
          className="text-xs rounded-lg border border-gray-200 px-2 py-1.5"
        />
        <input
          type="time"
          value={form.startTime}
          onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
          className="text-xs rounded-lg border border-gray-200 px-2 py-1.5"
        />
        <input
          type="time"
          value={form.endTime}
          onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
          className="text-xs rounded-lg border border-gray-200 px-2 py-1.5"
        />
        <input
          value={form.room}
          onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
          placeholder="Room (optional)"
          className="text-xs rounded-lg border border-gray-200 px-2 py-1.5"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg px-3 py-1.5 disabled:opacity-60"
      >
        {submitting ? "Adding…" : "Add period"}
      </button>
    </form>
  );
};

const ClassroomCard = ({ classroom, onChanged }) => {
  const [expanded, setExpanded] = useState(false);

  const removePeriod = async (day, index) => {
    await adminRemovePeriod(classroom._id, day, index);
    onChanged();
  };

  const remove = async () => {
    if (!confirm(`Delete ${classroom.className}? This cannot be undone.`)) return;
    await adminDeleteClassroom(classroom._id);
    onChanged();
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <School size={16} className="text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{classroom.className}</p>
            <p className="text-[11px] text-gray-400">
              {classroom.branch} · Year {classroom.year} {classroom.section ? `· ${classroom.section}` : ""} ·{" "}
              {classroom.studentCount} students
            </p>
          </div>
        </div>
        <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
              <CalendarClock size={13} /> Timetable
            </p>
            <button onClick={remove} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
              <Trash2 size={12} /> Delete classroom
            </button>
          </div>

          {DAYS.map((day) => {
            const periods = classroom.timetable?.[day] || [];
            if (periods.length === 0) return null;
            return (
              <div key={day}>
                <p className="text-[11px] font-medium text-gray-500 mb-1">{day}</p>
                <div className="space-y-1">
                  {periods.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-700">
                        {p.subject} · {p.faculty} · {p.startTime}–{p.endTime}
                      </span>
                      <button onClick={() => removePeriod(day, i)} className="text-gray-300 hover:text-red-500">
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

const ClassroomManagement = () => {
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState([]);

  const load = async () => {
    const { data } = await adminListAllClassrooms();
    setClassrooms(data?.data?.classrooms || []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Classrooms</h1>
        <p className="text-sm text-gray-500">
          Create classrooms and their timetables — faculty assignments, attendance, exams,
          assignments and notes all depend on a classroom existing here first.
        </p>
      </div>

      <CreateClassroomForm onCreated={load} />

      {classrooms.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <School size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No classrooms yet — create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classrooms.map((c) => (
            <ClassroomCard key={c._id} classroom={c} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassroomManagement;