import { useEffect, useState } from "react";
import { CalendarDays, Loader2, Save, CheckCircle2, Download } from "lucide-react";
import {
  getMyAssignments,
  getRoster,
  markRosterAttendance,
  exportRosterAttendanceUrl,
} from "../../api/faculty.api";

const todayStr = () => new Date().toISOString().slice(0, 10);

const FacultyAttendance = () => {
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(""); // "classroomId::subject"
  const [date, setDate] = useState(todayStr());
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMyAssignments()
      .then(({ data }) => {
        const list = data?.data?.assignments || [];
        setAssignments(list);
        if (list.length > 0) {
          setSelected(`${list[0].classroom._id}::${list[0].subject}`);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loadRoster = async () => {
    if (!selected) return;
    const [classroomId, subject] = selected.split("::");
    setRosterLoading(true);
    setMessage("");
    try {
      const { data } = await getRoster(classroomId, subject, date);
      setStudents(
        (data?.data?.students || []).map((s) => ({
          ...s,
          status: s.status || "present",
        }))
      );
    } finally {
      setRosterLoading(false);
    }
  };

  useEffect(() => {
    if (selected) loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, date]);

  const toggle = (studentId) => {
    setStudents((prev) =>
      prev.map((s) =>
        s._id === studentId
          ? { ...s, status: s.status === "present" ? "absent" : "present" }
          : s
      )
    );
  };

  const save = async () => {
    if (!selected) return;
    const [classroomId, subject] = selected.split("::");
    setSaving(true);
    setMessage("");
    try {
      await markRosterAttendance({
        classroomId,
        subject,
        date,
        records: students.map((s) => ({ studentId: s._id, status: s.status })),
      });
      setMessage("Saved.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Couldn't save attendance.");
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

  if (assignments.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <CalendarDays size={26} className="text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          You don't have any class assignments yet. Ask an admin to assign you
          to a classroom and subject.
        </p>
      </div>
    );
  }

  const presentCount = students.filter((s) => s.status === "present").length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Mark Attendance</h1>
          <p className="text-sm text-gray-500">Roster-based attendance for your class</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            {assignments.map((a) => (
              <option key={`${a.classroom._id}::${a.subject}`} value={`${a.classroom._id}::${a.subject}`}>
                {a.classroom.className} · {a.subject}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          {selected && (
            <a
              href={exportRosterAttendanceUrl(...selected.split("::"))}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              title="Download attendance history as Excel"
            >
              <Download size={14} />
            </a>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-50">
          <p className="text-sm text-gray-500">
            {presentCount}/{students.length} present
          </p>
          {message && <p className="text-xs text-gray-500">{message}</p>}
        </div>
        {rosterLoading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="animate-spin text-gray-300" size={20} />
          </div>
        ) : (
          <div className="max-h-112 overflow-y-auto divide-y divide-gray-50">
            {students.map((s) => (
              <button
                key={s._id}
                onClick={() => toggle(s._id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <p className="text-sm text-gray-900">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-[11px] text-gray-400">{s.rollNumber}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${
                    s.status === "present"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {s.status === "present" && <CheckCircle2 size={12} />}
                  {s.status === "present" ? "Present" : "Absent"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={save}
        disabled={saving || students.length === 0}
        className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Save attendance
      </button>
    </div>
  );
};

export default FacultyAttendance;