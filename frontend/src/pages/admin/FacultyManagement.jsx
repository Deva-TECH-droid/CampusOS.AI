import { useEffect, useState } from "react";
import { Loader2, UserPlus, Check, X, Clock3 } from "lucide-react";
import {
  adminListFaculty,
  adminListClassrooms,
  adminCreateOrAssignFaculty,
  adminListPendingFaculty,
  adminApproveFaculty,
  adminRejectFaculty,
} from "../../api/faculty.api";

const FacultyManagement = () => {
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [pending, setPending] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    classroomId: "",
    subject: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    const [facultyRes, classroomsRes, pendingRes] = await Promise.all([
      adminListFaculty(),
      adminListClassrooms(),
      adminListPendingFaculty(),
    ]);
    const facultyList = facultyRes?.data?.data?.faculty || [];
    const classroomList = classroomsRes?.data?.data?.classrooms || [];
    setFaculty(facultyList);
    setClassrooms(classroomList);
    setPending(pendingRes?.data?.data?.faculty || []);
    if (classroomList.length > 0) {
      setForm((f) => ({ ...f, classroomId: f.classroomId || classroomList[0]._id }));
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!form.email || !form.classroomId || !form.subject) {
      setMessage("Email, classroom and subject are required.");
      return;
    }
    setSubmitting(true);
    try {
      await adminCreateOrAssignFaculty(form);
      setMessage("Saved.");
      setForm((f) => ({ ...f, firstName: "", lastName: "", email: "", password: "", subject: "" }));
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Couldn't save.");
    } finally {
      setSubmitting(false);
    }
  };

  const approve = async (id) => {
    setBusyId(id);
    try {
      await adminApproveFaculty(id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    setBusyId(id);
    try {
      await adminRejectFaculty(id);
      await load();
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Faculty</h1>
        <p className="text-sm text-gray-500">
          Create faculty accounts and assign them to classes and subjects.
        </p>
      </div>

      {pending.length > 0 && (
        <div className="bg-white border border-amber-100 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <Clock3 size={15} className="text-amber-500" /> Pending teacher approvals
          </h2>
          <div className="space-y-2">
            {pending.map((f) => (
              <div
                key={f._id}
                className="flex items-center justify-between gap-3 bg-amber-50/50 border border-amber-100 rounded-lg px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-900">
                    {f.firstName} {f.lastName}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {f.email} · {f.department} · {f.employeeId}
                  </p>
                  {f.requestedSubjects?.length > 0 && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Wants to teach: {f.requestedSubjects.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => reject(f._id)}
                    disabled={busyId === f._id}
                    className="flex items-center gap-1 text-xs font-medium text-red-600 border border-red-100 rounded-lg px-2.5 py-1.5 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X size={12} /> Reject
                  </button>
                  <button
                    onClick={() => approve(f._id)}
                    disabled={busyId === f._id}
                    className="flex items-center gap-1 text-xs font-medium text-white bg-gray-900 rounded-lg px-2.5 py-1.5 hover:bg-gray-800 disabled:opacity-50"
                  >
                    <Check size={12} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-3">
            After approving, use the form below to link them to a classroom + subject so their
            portal actually has data to show.
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
          <UserPlus size={15} /> Add / assign faculty
        </h2>
        <form onSubmit={submit} className="space-y-2.5">
          <p className="text-[11px] text-gray-400">
            If the email already belongs to a faculty account, this just adds a new class+subject
            assignment to it — leave the name/password fields blank in that case.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              placeholder="First name"
              className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              placeholder="Last name"
              className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email"
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Password (only needed for a new account)"
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <select
              value={form.classroomId}
              onChange={(e) => setForm((f) => ({ ...f, classroomId: e.target.value }))}
              className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              {classrooms.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.className}
                </option>
              ))}
            </select>
            <input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Subject (must match timetable)"
              className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          {message && <p className="text-xs text-gray-500">{message}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
        {faculty.length === 0 ? (
          <p className="text-xs text-gray-400 p-4">No faculty accounts yet.</p>
        ) : (
          faculty.map((f) => (
            <div key={f._id} className="px-4 py-3">
              <p className="text-sm text-gray-900">
                {f.firstName} {f.lastName}
              </p>
              <p className="text-[11px] text-gray-400 mb-1">{f.email}</p>
              <div className="flex flex-wrap gap-1.5">
                {(f.facultyAssignments || []).map((a, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                  >
                    {a.classroom?.className} · {a.subject}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FacultyManagement;
