import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Save,
  CheckCircle2,
  Download,
  ScanFace,
  Mail,
  Send,
  X,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  getMyAssignments,
  getRoster,
  markRosterAttendance,
  exportRosterAttendanceUrl,
  exportStudentListExcelUrl,
  sendStudentListToAdmin,
  markTeacherFaceAttendance,
  getTeacherTodayStatus,
} from "../../api/faculty.api";
import FaceScannerCam from "../../components/attendance/FaceScannerCam";
import useFaceApiModels from "../../hooks/useFaceApiModels";

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

  // Teacher Daily Face Attendance state (Req 9)
  const [teacherStatus, setTeacherStatus] = useState(null);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [faceError, setFaceError] = useState("");
  const [faceSuccess, setFaceSuccess] = useState("");
  const scannerRef = useRef(null);
  const { ready: modelsReady, error: modelsError } = useFaceApiModels();

  // Excel download & email to admin state (Req 12 & 13)
  const [excelDownloaded, setExcelDownloaded] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    Promise.all([getMyAssignments(), getTeacherTodayStatus()])
      .then(([assignRes, statusRes]) => {
        const list = assignRes?.data?.data?.assignments || [];
        setAssignments(list);
        if (list.length > 0) {
          setSelected(`${list[0].classroom._id}::${list[0].subject}`);
        }
        setTeacherStatus(statusRes?.data?.data || null);
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
    setExcelDownloaded(false);
    setEmailMessage("");
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

  // Trigger teacher face capture
  const handleTeacherFaceScan = async () => {
    const descriptor = scannerRef.current?.capture();
    if (!descriptor) {
      setFaceError("No face detected. Please position your face clearly in the camera.");
      return;
    }

    setScanning(true);
    setFaceError("");
    setFaceSuccess("");

    try {
      const { data } = await markTeacherFaceAttendance(Array.from(descriptor));
      const record = data?.data?.record;
      setFaceSuccess(data?.message || "Attendance recorded successfully!");
      setTeacherStatus({ marked: true, record });
      setTimeout(() => {
        setShowFaceModal(false);
        setFaceSuccess("");
      }, 2000);
    } catch (err) {
      setFaceError(err?.response?.data?.message || "Face verification failed. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  // Handle Excel download trigger
  const handleDownloadExcel = () => {
    if (!selected) return;
    const [classroomId, subject] = selected.split("::");
    const downloadUrl = exportStudentListExcelUrl(classroomId, subject);
    window.location.href = downloadUrl;
    setExcelDownloaded(true);
    setEmailMessage("");
  };

  // Handle send Excel to admin via email
  const handleSendToAdmin = async () => {
    if (!selected) return;
    const [classroomId, subject] = selected.split("::");
    setSendingEmail(true);
    setEmailMessage("");
    try {
      const { data } = await sendStudentListToAdmin(classroomId, subject);
      setEmailMessage(data?.message || "Student list has been successfully sent to the admin.");
    } catch (err) {
      setEmailMessage(err?.response?.data?.message || "Failed to send student list to admin.");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }

  const selectedAssignment = assignments.find(
    (a) => `${a.classroom._id}::${a.subject}` === selected
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner: Teacher Daily Face Attendance (Req 9) */}
      <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ScanFace size={22} />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Teacher Daily Attendance</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Face recognition attendance check-in for faculty members
            </p>
          </div>
        </div>

        <div>
          {teacherStatus?.marked ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-emerald-300 text-xs font-medium">
              <CheckCircle2 size={16} />
              <span>Present today at {teacherStatus.record?.time || "recorded"}</span>
            </div>
          ) : (
            <button
              onClick={() => setShowFaceModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <ScanFace size={15} />
              Mark My Attendance (Face Scan)
            </button>
          )}
        </div>
      </div>

      {/* Roster Controls & Classroom Selector */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Class Attendance Roster</h1>
          <p className="text-xs text-gray-500">Manage, export, and record student attendance</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="text-xs rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
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
            className="text-xs rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
          />

          {selected && (
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm font-medium"
              title="Download formatted Student List as Excel"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Download Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Excel Downloaded Banner with "Send to Admin" (Req 12 & 13) */}
      {excelDownloaded && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900 transition-all">
          <div className="flex items-center gap-2 text-xs font-medium">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Excel downloaded successfully ({selectedAssignment?.subject} — {selectedAssignment?.classroom?.className}).</span>
          </div>

          <button
            onClick={handleSendToAdmin}
            disabled={sendingEmail}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors shrink-0 shadow-sm"
          >
            {sendingEmail ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Send to Admin
          </button>
        </div>
      )}

      {emailMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
          <Mail size={15} className="text-blue-600 shrink-0" />
          <span>{emailMessage}</span>
        </div>
      )}

      {/* Students List Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/50">
          <p className="text-xs font-semibold text-gray-700">
            {students.filter((s) => s.status === "present").length}/{students.length} students present
          </p>
          {message && <p className="text-xs text-emerald-600 font-medium">{message}</p>}
        </div>

        {rosterLoading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="animate-spin text-gray-300" size={20} />
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No students enrolled in this classroom yet.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {students.map((s) => (
              <button
                key={s._id}
                onClick={() => toggle(s._id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-[11px] text-gray-400">{s.rollNumber} {s.email ? `· ${s.email}` : ""}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${
                    s.status === "present"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-600 border border-red-100"
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
        className="w-full px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Save Class Attendance
      </button>

      {/* Teacher Face Attendance Modal */}
      {showFaceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowFaceModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <ScanFace size={18} className="text-emerald-600" />
                Scan Face — Faculty Attendance
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Position your face within the frame to verify identity
              </p>
            </div>

            {modelsError ? (
              <p className="text-xs text-red-600">{modelsError}</p>
            ) : (
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-black aspect-4/3 relative">
                <FaceScannerCam ref={scannerRef} active={modelsReady} />
              </div>
            )}

            {faceError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-1">
                <AlertCircle size={14} />
                {faceError}
              </p>
            )}

            {faceSuccess && (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 size={14} />
                {faceSuccess}
              </p>
            )}

            <button
              onClick={handleTeacherFaceScan}
              disabled={scanning || !modelsReady}
              className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {scanning ? <Loader2 size={14} className="animate-spin" /> : <ScanFace size={14} />}
              Verify Face & Mark Attendance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyAttendance;