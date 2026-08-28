import { useEffect, useRef, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  ScanFace,
  Loader2,
  X,
  CheckCircle2,
  Search,
  Download,
} from "lucide-react";
import FaceScannerCam from "../../components/attendance/FaceScannerCam";
import useFaceApiModels from "../../hooks/useFaceApiModels";
import api from "../../api/axios";
import {
  adminListStudents,
  adminEnrollFace,
  adminGetStats,
  adminGetLogs,
  adminMarkManual,
} from "../../api/attendance.api";

const SAMPLES_NEEDED = 5;

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tone}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-2xl font-semibold text-gray-900 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  </div>
);

// ── Enroll-on-behalf-of-student modal ──
const EnrollModal = ({ student, onClose, onDone }) => {
  const { ready, error: modelError } = useFaceApiModels();
  const scannerRef = useRef(null);
  const [samples, setSamples] = useState([]);
  const [status, setStatus] = useState("loading");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const capture = () => {
    const d = scannerRef.current?.capture();
    if (!d) return;
    setSamples((prev) => [...prev, d].slice(0, SAMPLES_NEEDED));
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await adminEnrollFace(student._id, samples);
      onDone();
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't save face profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        >
          <X size={18} />
        </button>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          Enroll face — {student.firstName} {student.lastName}
        </h3>
        <p className="text-xs text-gray-500 mb-4">{student.rollNumber}</p>

        {modelError ? (
          <p className="text-xs text-red-600">{modelError}</p>
        ) : (
          <>
            <FaceScannerCam ref={scannerRef} active={ready} onStatusChange={setStatus} />
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {Array.from({ length: SAMPLES_NEEDED }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < samples.length ? "bg-gray-900" : "bg-gray-200"}`}
                />
              ))}
            </div>
            {error && <p className="text-xs text-red-600 text-center mt-2">{error}</p>}
            <div className="mt-4">
              {samples.length < SAMPLES_NEEDED ? (
                <button
                  onClick={capture}
                  disabled={!ready || status !== "detected"}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  Capture sample {samples.length + 1}
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Save face profile
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const AttendanceAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [enrollTarget, setEnrollTarget] = useState(null);

  const [manualForm, setManualForm] = useState({
    studentId: "",
    subject: "",
    status: "present",
    date: "",
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualMessage, setManualMessage] = useState("");

  const loadAll = async () => {
    const [statsRes, studentsRes, logsRes] = await Promise.all([
      adminGetStats(),
      adminListStudents(),
      adminGetLogs(),
    ]);
    setStats(statsRes?.data?.data || null);
    setStudents(studentsRes?.data?.data?.students || []);
    setLogs(logsRes?.data?.data?.logs || []);
  };

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, []);

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q)
    );
  });

  const submitManual = async (e) => {
    e.preventDefault();
    if (!manualForm.studentId || !manualForm.subject) return;
    setManualSubmitting(true);
    setManualMessage("");
    try {
      await adminMarkManual(manualForm);
      setManualMessage("Saved.");
      const logsRes = await adminGetLogs();
      setLogs(logsRes?.data?.data?.logs || []);
    } catch (err) {
      setManualMessage(err?.response?.data?.message || "Failed to save.");
    } finally {
      setManualSubmitting(false);
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total students"
          value={stats?.totalStudents ?? 0}
          tone="bg-gray-100 text-gray-700"
        />
        <StatCard
          icon={UserCheck}
          label="Present today"
          value={stats?.presentToday ?? 0}
          tone="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={UserX}
          label="Absent today"
          value={stats?.absentToday ?? 0}
          tone="bg-red-50 text-red-600"
        />
      </div>

      {/* Roster + enrollment */}
      <div className="bg-white border border-gray-100 rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">
            Students &amp; face enrollment
          </h2>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or roll no."
              className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
          {filteredStudents.length === 0 ? (
            <p className="text-xs text-gray-400 p-4">No students found.</p>
          ) : (
            filteredStudents.map((s) => (
              <div key={s._id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {s.rollNumber} {s.classroom?.className ? `· ${s.classroom.className}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.presentToday && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                      Present
                    </span>
                  )}
                  {s.faceEnrolled ? (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <CheckCircle2 size={12} className="text-emerald-500" /> Enrolled
                    </span>
                  ) : (
                    <button
                      onClick={() => setEnrollTarget(s)}
                      className="flex items-center gap-1 text-[11px] font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-2 py-1"
                    >
                      <ScanFace size={12} /> Enroll face
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent logs */}
        <div className="bg-white border border-gray-100 rounded-xl">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent check-ins</h2>
            <a
              href={`${api.defaults.baseURL}/attendance/admin/export`}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5"
            >
              <Download size={12} /> Export Excel
            </a>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-400 p-4">No attendance logged yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {log.student ? `${log.student.firstName} ${log.student.lastName}` : "—"}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {log.subject} · {new Date(log.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      log.method === "face"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {log.method === "face" ? "Face" : "Manual"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Manual override */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Manual attendance override</h2>
          <form onSubmit={submitManual} className="space-y-2.5">
            <select
              value={manualForm.studentId}
              onChange={(e) => setManualForm((f) => ({ ...f, studentId: e.target.value }))}
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.firstName} {s.lastName} ({s.rollNumber})
                </option>
              ))}
            </select>
            <input
              value={manualForm.subject}
              onChange={(e) => setManualForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Subject (must match timetable)"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <div className="flex gap-2.5">
              <select
                value={manualForm.status}
                onChange={(e) => setManualForm((f) => ({ ...f, status: e.target.value }))}
                className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
              <input
                type="date"
                value={manualForm.date}
                onChange={(e) => setManualForm((f) => ({ ...f, date: e.target.value }))}
                className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
            {manualMessage && <p className="text-xs text-gray-500">{manualMessage}</p>}
            <button
              type="submit"
              disabled={manualSubmitting}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
              {manualSubmitting ? "Saving…" : "Save"}
            </button>
          </form>
        </div>
      </div>

      {enrollTarget && (
        <EnrollModal
          student={enrollTarget}
          onClose={() => setEnrollTarget(null)}
          onDone={() => {
            setEnrollTarget(null);
            loadAll();
          }}
        />
      )}
    </div>
  );
};

export default AttendanceAdmin;
