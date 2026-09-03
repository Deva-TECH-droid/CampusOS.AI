import { useEffect, useState } from "react";
import { Loader2, UserPlus2, Check, X, Inbox } from "lucide-react";
import { listPendingStudents, approveStudent, rejectStudent } from "../../api/faculty.api";

const FacultyStudentApprovals = () => {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadPending = async () => {
    const { data } = await listPendingStudents();
    setPendingStudents(data?.data?.students || []);
  };

  useEffect(() => {
    loadPending().finally(() => setLoading(false));
  }, []);

  const approvePending = async (studentId) => {
    setBusyId(studentId);
    try {
      await approveStudent(studentId);
      await loadPending();
    } finally {
      setBusyId(null);
    }
  };

  const rejectPending = async (studentId) => {
    setBusyId(studentId);
    try {
      await rejectStudent(studentId);
      await loadPending();
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
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-1.5">
          <UserPlus2 size={17} className="text-amber-500" /> Student Requests
        </h1>
        <p className="text-sm text-gray-500">
          Students who selected you at signup wait here until you approve them —
          approving assigns them to your classroom automatically.
        </p>
      </div>

      {pendingStudents.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <Inbox size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No pending requests right now.</p>
        </div>
      ) : (
        <div className="bg-white border border-amber-100 rounded-xl p-4 space-y-2">
          {pendingStudents.map((s) => (
            <div
              key={s._id}
              className="flex items-center justify-between gap-3 bg-amber-50/50 border border-amber-100 rounded-lg px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-900">
                  {s.firstName} {s.lastName}
                </p>
                <p className="text-[11px] text-gray-500">
                  {s.rollNumber} · wants to join {s.pendingRequest?.subject}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => rejectPending(s._id)}
                  disabled={busyId === s._id}
                  className="flex items-center gap-1 text-xs font-medium text-red-600 border border-red-100 rounded-lg px-2.5 py-1.5 hover:bg-red-50 disabled:opacity-50"
                >
                  <X size={12} /> Reject
                </button>
                <button
                  onClick={() => approvePending(s._id)}
                  disabled={busyId === s._id}
                  className="flex items-center gap-1 text-xs font-medium text-white bg-gray-900 rounded-lg px-2.5 py-1.5 hover:bg-gray-800 disabled:opacity-50"
                >
                  <Check size={12} /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyStudentApprovals;