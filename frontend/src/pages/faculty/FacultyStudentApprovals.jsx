import { useEffect, useState } from "react";
import {
  Loader2,
  UserPlus2,
  Check,
  X,
  Inbox,
  UserCheck,
  UserX,
  Users,
  Download,
  School,
  Send,
  CheckCircle2,
} from "lucide-react";
import {
  listPendingStudents,
  listApprovedStudents,
  listRejectedStudents,
  listEnrolledStudents,
  approveStudent,
  rejectStudent,
  exportStudentListExcelUrl,
  sendStudentListToAdmin,
} from "../../api/faculty.api";

export default function FacultyStudentApprovals() {
  const [activeTab, setActiveTab] = useState("pending"); // "pending", "approved", "rejected", "enrolled"
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [enrolled, setEnrolled] = useState([]);

  // Send to admin state (Req 13)
  const [sendingGroup, setSendingGroup] = useState(null); // group index
  const [sendMessages, setSendMessages] = useState({});   // { idx: message }

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, aRes, rRes, eRes] = await Promise.all([
        listPendingStudents(),
        listApprovedStudents(),
        listRejectedStudents(),
        listEnrolledStudents(),
      ]);
      setPending(pRes?.data?.data?.students || []);
      setApproved(aRes?.data?.data?.students || []);
      setRejected(rRes?.data?.data?.students || []);
      setEnrolled(eRes?.data?.data?.enrollments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleApprove = async (studentId) => {
    setBusyId(studentId);
    try {
      await approveStudent(studentId);
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (studentId) => {
    setBusyId(studentId);
    try {
      await rejectStudent(studentId);
      await loadAll();
    } finally {
      setBusyId(null);
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <UserPlus2 size={20} className="text-amber-500" />
          Student Requests & Enrollment
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Review signup requests from students, manage approvals, and view enrolled class rosters
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit flex-wrap gap-1">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "pending"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Inbox size={13} />
          Pending Requests ({pending.length})
        </button>

        <button
          onClick={() => setActiveTab("approved")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "approved"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <UserCheck size={13} />
          Approved ({approved.length})
        </button>

        <button
          onClick={() => setActiveTab("rejected")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "rejected"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <UserX size={13} />
          Rejected ({rejected.length})
        </button>

        <button
          onClick={() => setActiveTab("enrolled")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "enrolled"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Users size={13} />
          Enrolled by Class ({enrolled.reduce((acc, e) => acc + e.studentCount, 0)})
        </button>
      </div>

      {/* 1. Pending Requests View */}
      {activeTab === "pending" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Pending Student Applications
          </h2>

          {pending.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              <Inbox size={28} className="mx-auto mb-2 text-gray-300" />
              No pending student requests right now.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pending.map((s) => {
                const requestedSub =
                  s.studentRequests?.[0]?.subject ||
                  s.pendingRequest?.subject ||
                  "Subject";
                return (
                  <div
                    key={s._id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Roll: {s.rollNumber} · Department: {s.department || s.branch} · Year {s.year || 1}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        Requested subject: {requestedSub}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(s._id)}
                        disabled={busyId === s._id}
                        className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <X size={13} /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(s._id)}
                        disabled={busyId === s._id}
                        className="px-3.5 py-1.5 bg-gray-900 text-white hover:bg-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <Check size={13} /> Approve Student
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Approved Students View */}
      {activeTab === "approved" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Approved Students
          </h2>

          {approved.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No approved students found yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {approved.map((s) => (
                <div key={s._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {s.rollNumber} · {s.email}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Class: {s.classroom?.className || "Enrolled"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Rejected Requests View */}
      {activeTab === "rejected" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Rejected Requests
          </h2>

          {rejected.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No rejected requests on file.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {rejected.map((s) => (
                <div key={s._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {s.rollNumber} · {s.email}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-red-50 text-red-600 border border-red-200">
                    Rejected
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Enrolled Students by Class/Subject */}
      {activeTab === "enrolled" && (
        <div className="space-y-4">
          {enrolled.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 text-xs shadow-sm">
              No classroom enrollments found. Ask an admin to assign classes and subjects to your profile.
            </div>
          ) : (
            enrolled.map((group, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      <School size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {group.subject}
                        <span className="text-xs font-normal text-gray-500">
                          ({group.className})
                        </span>
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        {group.studentCount} students enrolled
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={exportStudentListExcelUrl(group.classroomId, group.subject)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors w-fit"
                    >
                      <Download size={13} />
                      Download Excel
                    </a>
                    <button
                      onClick={async () => {
                        setSendingGroup(idx);
                        try {
                          await sendStudentListToAdmin(group.classroomId, group.subject);
                          setSendMessages((prev) => ({ ...prev, [idx]: "✓ Sent to admin successfully!" }));
                        } catch {
                          setSendMessages((prev) => ({ ...prev, [idx]: "Failed to send. Please try again." }));
                        } finally {
                          setSendingGroup(null);
                        }
                      }}
                      disabled={sendingGroup === idx}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-60 w-fit"
                    >
                      {sendingGroup === idx ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      Send to Admin
                    </button>
                  </div>
                  {sendMessages[idx] && (
                    <p className={`text-[11px] mt-1 flex items-center gap-1 ${
                      sendMessages[idx].startsWith("✓") ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {sendMessages[idx].startsWith("✓") && <CheckCircle2 size={11} />}
                      {sendMessages[idx]}
                    </p>
                  )}
                </div>

                {group.students.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    No students currently in this class roster.
                  </p>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                    {group.students.map((st) => (
                      <div
                        key={st._id}
                        className="py-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {st.firstName} {st.lastName}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {st.rollNumber} {st.email ? `· ${st.email}` : ""}
                          </p>
                        </div>
                        <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                          {st.department || st.branch || "Student"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}