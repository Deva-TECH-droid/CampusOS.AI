import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, GitBranch, Globe, Code, MessageSquare, Lightbulb } from "lucide-react";
import { createStory } from "../../api/alumni.api";

export default function ShareExperience() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    company: "",
    role: "",
    content: "",
    adviceForJuniors: "",
    githubLink: "",
    projectLink: "",
    postType: "experience",
    tags: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required.");
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
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-950 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
          <Sparkles size={22} className="text-amber-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Share Alumni Experience & Projects</h1>
        <p className="text-xs text-gray-500 mt-1">
          Provide career advice, industry insights, or showcase open-source projects for current students
        </p>
      </div>

      <form onSubmit={submit} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
        {/* Post Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Post Category</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "experience", label: "Work Experience", icon: Lightbulb },
              { id: "project", label: "Project & GitHub", icon: Code },
              { id: "community", label: "Community Discussion", icon: MessageSquare },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, postType: id }))}
                className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${form.postType === id
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-gray-50/50 hover:bg-gray-100 border-gray-200 text-gray-600"
                  }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Post Title</label>
          <input
            value={form.title}
            onChange={update("title")}
            placeholder="e.g. From College to Software Engineer at XYZ / My Open-Source Fullstack App"
            className="w-full text-xs rounded-xl border border-gray-200 px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Organization</label>
            <input
              value={form.company}
              onChange={update("company")}
              placeholder="e.g. Google, Microsoft, XYZ"
              className="w-full text-xs rounded-xl border border-gray-200 px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Current Role</label>
            <input
              value={form.role}
              onChange={update("role")}
              placeholder="e.g. Full-Stack Developer"
              className="w-full text-xs rounded-xl border border-gray-200 px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Experience & Details</label>
          <textarea
            value={form.content}
            onChange={update("content")}
            rows={5}
            placeholder="Describe your journey, industry technologies used, project architecture, or interview preparation tips…"
            className="w-full text-xs rounded-xl border border-gray-200 p-3.5 focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Advice for Juniors (Optional)</label>
          <textarea
            value={form.adviceForJuniors}
            onChange={update("adviceForJuniors")}
            rows={3}
            placeholder="Key skills to learn, common mistakes to avoid, networking tips…"
            className="w-full text-xs rounded-xl border border-gray-200 p-3.5 focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
          />
        </div>

        {/* Project Links (Req 15) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <GitBranch size={13} /> GitHub Repository URL
            </label>
            <input
              value={form.githubLink}
              onChange={update("githubLink")}
              placeholder="https://github.com/username/project"
              className="w-full text-xs rounded-xl border border-gray-200 px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Globe size={13} /> Live Project / Demo Link
            </label>
            <input
              value={form.projectLink}
              onChange={update("projectLink")}
              placeholder="https://my-cool-project.com"
              className="w-full text-xs rounded-xl border border-gray-200 px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Tags</label>
          <input
            value={form.tags}
            onChange={update("tags")}
            placeholder="React, Node.js, DSA, System Design, Career"
            className="w-full text-xs rounded-xl border border-gray-200 px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-gray-950 text-white text-xs font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          Publish Experience Post
        </button>
      </form>
    </div>
  );
}
