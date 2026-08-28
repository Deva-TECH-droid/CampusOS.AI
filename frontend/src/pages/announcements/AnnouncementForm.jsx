import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createAnnouncement } from "../../api/announcement.api";
import { getClubDetails } from "../../api/club.api";
import { getEventById } from "../../api/event.api";
import ImageUploadZone from "../../components/forms/ImageUploadZone"; // ✅ Integrated dropzone component
import useAuth from "../../hooks/useAuth";

const MAX_TITLE = 100;
const MAX_BODY = 2000;

// ─── Field Components ─────────────────────────────────────────
const Label = ({ children, required, counter }) => (
  <div className="flex items-center justify-between mb-1.5">
    <label className="text-xs font-medium text-gray-700">
      {children} {required && <span className="text-red-400">*</span>}
    </label>
    {counter !== undefined && (
      <span
        className={`text-xs tabular-nums ${counter < 20 ? "text-amber-500" : "text-gray-300"}`}
      >
        {counter} left
      </span>
    )}
  </div>
);

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-400 mt-1.5">{message}</p> : null;

// ─── Main ─────────────────────────────────────────────────────
export default function CreateAnnouncement() {
  const { targetType, targetId } = useParams();
  const {user}=useAuth();
  const navigate = useNavigate();

  const isClub = targetType === "club";

  const [form, setForm] = useState({ title: "", body: "", image: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (targetType === "club") {
          const payload = await getClubDetails(targetId);
          if (!payload.data.data.isAdmin) {
            navigate(-1);
          }
        }
        if (targetType === "event") {
          const payload = await getEventById(targetId);
          if (!payload.data.data.isOrganizer&&user.role!=="superadmin") {
            navigate(-1);
          }
        }
      } catch (err) {
        console.error("Authorization fetch failed:", err);
        navigate(-1);
      }
    };
    fetchData();
  }, [targetType, targetId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.body.trim()) e.body = "Body is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setSubmitError("");
    try {
      await createAnnouncement(targetType, targetId, {
        title: form.title.trim(),
        body: form.body.trim(),
        image: form.image || null, // ✅ Send the Cloudinary URL string or null if unpopulated
      });

      navigate(`/community/${isClub ? "clubs" : "events"}/${targetId}`, {
        state: {
          toast: isClub
            ? "Announcement posted successfully"
            : "Event update posted successfully",
        },
      });
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to post announcement",
      );
    } finally {
      setLoading(false);
    }
  };

  const titleLeft = MAX_TITLE - form.title.length;
  const bodyLeft = MAX_BODY - form.body.length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">
            {isClub ? "Post Announcement" : "Post Event Update"}
          </h2>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full
            ${isClub ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}
          >
            {isClub ? "Club" : "Event"}
          </span>
        </div>
        <p className="text-xs text-gray-400">
          {isClub
            ? "Visible to all followers and members of this club."
            : "Delivered to all students registered for this event."}
        </p>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-6">
          <p className="text-xs text-red-700">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-5">
          {/* Title */}
          <div>
            <Label required counter={titleLeft}>
              Title
            </Label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={MAX_TITLE}
              placeholder={
                isClub
                  ? "e.g. Core Team Applications Open"
                  : "e.g. Venue changed to Seminar Hall B"
              }
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300 transition-colors"
            />
            <FieldError message={errors.title} />
          </div>

          {/* Body */}
          <div>
            <Label required counter={bodyLeft}>
              Body
            </Label>
            <textarea
              name="body"
              value={form.body}
              onChange={handleChange}
              maxLength={MAX_BODY}
              rows={7}
              placeholder={
                isClub
                  ? "Share news, updates, or information for your followers..."
                  : "Share important updates with registered students..."
              }
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300 transition-colors resize-none"
            />
            <FieldError message={errors.body} />
          </div>

          {/* ✅ Swapped Out Legacy Input Elements with the Live ImageUploadZone Component */}
          <div>
            <ImageUploadZone
              label="Feature Announcement Graphic"
              value={form.image}
              folder={isClub ? "club-announcements" : "event-announcements"} // Routes to distinct asset folders dynamically
              onChange={(uploadedUrl) => {
                setForm((prev) => ({ ...prev, image: uploadedUrl }));
                setErrors((prev) => ({ ...prev, image: "" }));
              }}
            />
            <FieldError message={errors.image} />
          </div>
        </div>

        {/* Live Typography Preview Layer */}
        {(form.title || form.body) && (
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Live Preview Feed Item
            </p>
            {form.image && (
              <img
                src={form.image}
                alt=""
                className="w-full max-h-40 object-cover rounded-lg border border-gray-100 mb-3"
              />
            )}
            {form.title && (
              <p className="text-sm font-semibold text-gray-900 mb-1.5">
                {form.title}
              </p>
            )}
            {form.body && (
              <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">
                {form.body}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Posting..."
              : isClub
                ? "Post Announcement"
                : "Post Update"}
          </button>
        </div>
      </form>
    </div>
  );
}
