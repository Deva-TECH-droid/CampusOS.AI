import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { createStory } from "../../api/alumni.api";

const ShareExperience = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    company: "",
    role: "",
    content: "",
    adviceForJuniors: "",
    tags: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.company || !form.role || !form.content) {
      setError("Title, company, role and your story are required.");
      return;
    }
    setSubmitting(true);
    try {
      await createStory({
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      navigate("/alumni");
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't share your story.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="text-center">
        <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center mx-auto mb-3">
          <Sparkles size={20} className="text-white" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Share your experience</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tell juniors about your role, your journey, and what you'd tell your past self.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
        <input
          value={form.title}
          onChange={update("title")}
          placeholder="Title (e.g. From campus to SDE at Google)"
          className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            value={form.company}
            onChange={update("company")}
            placeholder="Current company"
            className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          <input
            value={form.role}
            onChange={update("role")}
            placeholder="Current role"
            className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>
        <textarea
          value={form.content}
          onChange={update("content")}
          rows={6}
          placeholder="Your journey, projects, what your day-to-day looks like…"
          className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
        />
        <textarea
          value={form.adviceForJuniors}
          onChange={update("adviceForJuniors")}
          rows={3}
          placeholder="Advice for juniors (optional)"
          className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
        />
        <input
          value={form.tags}
          onChange={update("tags")}
          placeholder="Tags, comma separated (e.g. backend, internships, DSA)"
          className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Share with juniors
        </button>
      </form>
    </div>
  );
};

export default ShareExperience;
