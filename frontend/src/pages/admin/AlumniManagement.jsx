import { useEffect, useState } from "react";
import { Loader2, UserPlus2 } from "lucide-react";
import { adminListAlumni, adminPromoteToAlumni } from "../../api/alumni.api";

const AlumniManagement = () => {
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState([]);
  const [form, setForm] = useState({
    email: "",
    graduationYear: "",
    currentCompany: "",
    currentRole: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    const { data } = await adminListAlumni();
    setAlumni(data?.data?.alumni || []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!form.email) {
      setMessage("Email is required.");
      return;
    }
    setSubmitting(true);
    try {
      await adminPromoteToAlumni(form);
      setMessage("Promoted to alumni.");
      setForm({ email: "", graduationYear: "", currentCompany: "", currentRole: "" });
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Couldn't promote this account.");
    } finally {
      setSubmitting(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Alumni</h1>
        <p className="text-sm text-gray-500">
          Promote a graduated student's existing account to Alumni so they can share their
          experience with juniors.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
          <UserPlus2 size={15} /> Promote to alumni
        </h2>
        <form onSubmit={submit} className="space-y-2.5">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Existing student's email"
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="number"
              value={form.graduationYear}
              onChange={(e) => setForm((f) => ({ ...f, graduationYear: e.target.value }))}
              placeholder="Graduation year"
              className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <input
              value={form.currentCompany}
              onChange={(e) => setForm((f) => ({ ...f, currentCompany: e.target.value }))}
              placeholder="Current company"
              className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <input
              value={form.currentRole}
              onChange={(e) => setForm((f) => ({ ...f, currentRole: e.target.value }))}
              placeholder="Current role"
              className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          {message && <p className="text-xs text-gray-500">{message}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {submitting ? "Saving…" : "Promote"}
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
        {alumni.length === 0 ? (
          <p className="text-xs text-gray-400 p-4">No alumni yet.</p>
        ) : (
          alumni.map((a) => (
            <div key={a._id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">
                  {a.firstName} {a.lastName}
                </p>
                <p className="text-[11px] text-gray-400">{a.email}</p>
              </div>
              <p className="text-[11px] text-gray-500 text-right">
                {a.alumniProfile?.currentRole} {a.alumniProfile?.currentCompany ? `· ${a.alumniProfile.currentCompany}` : ""}
                <br />
                {a.alumniProfile?.graduationYear ? `Class of ${a.alumniProfile.graduationYear}` : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlumniManagement;
