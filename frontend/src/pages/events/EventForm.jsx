import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, X, Plus } from "lucide-react";
import { createEvent, getEventById, updateEvent } from "../../api/event.api.js"; // Added getEventById & updateEvent
import { BRANCHES } from "../../constants/branches.js";
import { EVENT_CATEGORIES } from "../../constants/categories.js";
import useAuth from "../../hooks/useAuth.js";
import ImageUploadZone from "../../components/forms/ImageUploadZone.jsx";

const YEARS = [1, 2, 3, 4];

// ─── Reusable Field Components ────────────────────────────────
const Label = ({ children, required }) => (
  <label className="block text-xs font-medium text-gray-700 mb-1.5">
    {children} {required && <span className="text-red-400">*</span>}
  </label>
);

const Input = ({ ...props }) => (
  <input
    {...props}
    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300 transition-colors"
  />
);

const Textarea = ({ ...props }) => (
  <textarea
    {...props}
    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300 transition-colors resize-none"
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-gray-700 transition-colors"
  >
    {children}
  </select>
);

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-400 mt-1">{message}</p> : null;

const TogglePill = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150
      ${
        selected
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
      }`}
  >
    {label}
  </button>
);

const Section = ({ title, children }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4">
    <h3 className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-50">
      {title}
    </h3>
    {children}
  </div>
);

// ─── Skeleton Loader for Edit Fetch Fallback ──────────────────
const FormSkeleton = () => (
  <div className="max-w-3xl mx-auto animate-pulse px-4 py-6 space-y-6">
    <div className="w-20 h-4 bg-gray-100 rounded" />
    <div className="h-32 bg-gray-100 rounded-xl" />
    <div className="h-48 bg-gray-100 rounded-xl" />
  </div>
);

// ─── Main Component ───────────────────────────────────────────
const EventForm = ({ mode = "create" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clubId, eventId } = useParams(); // Can capture either dependent parameter from layout routes
  const { user } = useAuth();

  const isEditMode = mode === "edit";

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    eventName: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    venue: "",
    category: "",
    tags: [],
    organizerClub: clubId || "",
    eligibleBranches: [],
    eligibleYears: [],
    banner: "",
  });

  // ─── Edit Mode Data Initialization Effect ───────────────────
  useEffect(() => {
    if (!isEditMode) return;

    // 1. Optimistic check: Try reading data forwarded from navigate state
    if (location.state?.event) {
      populateForm(location.state.event);
      setLoading(false);
    } else if (eventId) {
      // 2. Fallback check: Fetch fresh data from API if page refreshed
      const fetchEventData = async () => {
        try {
          const res = await getEventById(eventId);
          const eventData = res?.data?.data?.event;
          if (eventData) {
            populateForm(eventData);
          } else {
            setErrors({ submit: "Event details could not be parsed." });
          }
        } catch (err) {
          console.error(err);
          setErrors({ submit: "Failed to load event settings for editing." });
        } finally {
          setLoading(false);
        }
      };
      fetchEventData();
    }
  }, [isEditMode, eventId, location.state]);

  // Helper to parse ISO strings back to raw input formats HTML elements expect
  const populateForm = (eventData) => {
    const start = new Date(eventData.startDateTime);
    const end = new Date(eventData.endDateTime);

    setForm({
      eventName: eventData.eventName || "",
      description: eventData.description || "",
      startDate: start.toISOString().split("T")[0],
      startTime: start.toTimeString().split(" ")[0].slice(0, 5),
      endDate: end.toISOString().split("T")[0],
      endTime: end.toTimeString().split(" ")[0].slice(0, 5),
      venue: eventData.venue || "",
      category: eventData.category || "",
      tags: eventData.tags || [],
      organizerClub: eventData.organizerClub?._id || eventData.organizerClub || clubId || "",
      eligibleBranches: eventData.eligibleBranches || [],
      eligibleYears: eventData.eligibleYears || [],
      banner: eventData.banner || "",
    });
  };

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleBranch = (branch) =>
    setForm((prev) => ({
      ...prev,
      eligibleBranches: prev.eligibleBranches.includes(branch)
        ? prev.eligibleBranches.filter((b) => b !== branch)
        : [...prev.eligibleBranches, branch],
    }));

  const toggleYear = (year) =>
    setForm((prev) => ({
      ...prev,
      eligibleYears: prev.eligibleYears.includes(year)
        ? prev.eligibleYears.filter((y) => y !== year)
        : [...prev.eligibleYears, year],
    }));

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setTagInput("");
  };

  const removeTag = (tag) =>
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));

  const validate = () => {
    const e = {};
    if (!form.eventName.trim()) e.eventName = "Event name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.startTime) e.startTime = "Start time is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (!form.endTime) e.endTime = "End time is required";
    if (!form.venue.trim()) e.venue = "Venue is required";
    if (!form.category) e.category = "Category is required";
    if (!form.organizerClub) e.organizerClub = "Organizer club is required";

    if (form.startDate && form.startTime && form.endDate && form.endTime) {
      const start = new Date(`${form.startDate}T${form.startTime}`);
      const end = new Date(`${form.endDate}T${form.endTime}`);
      if (end <= start) {
        e.endDate = "End date and time must be after start date and time";
      }
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);

    const startDateTime = new Date(`${form.startDate}T${form.startTime}`).toISOString();
    const endDateTime = new Date(`${form.endDate}T${form.endTime}`).toISOString();

    const payload = {
      eventName: form.eventName.trim(),
      description: form.description.trim(),
      startDateTime,
      endDateTime,
      venue: form.venue.trim(),
      category: form.category,
      tags: form.tags,
      organizerClub: form.organizerClub,
      eligibleBranches: form.eligibleBranches,
      eligibleYears: form.eligibleYears,
      banner: form.banner.trim() || null,
    };

    try {
      if (isEditMode) {
        await updateEvent(eventId, payload);
        navigate(`/community/events/${eventId}`); // Route back to refreshed Detail page
      } else {
        await createEvent(...payload);
        navigate(`/community/clubs/${clubId || form.organizerClub}`);
      }
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({
        ...prev,
        submit:
          err.response?.data?.message || `Failed to ${mode} event. Try again.`,
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <FormSkeleton />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditMode ? "Edit Event" : "Create Event"}
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {isEditMode
            ? "Modify modifications to tweak this running event config details"
            : "Fill in the details to publish a new club event configuration"}
        </p>
      </div>

      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Basic Information */}
        <Section title="Basic Information">
          <div>
            <Label required>Event Name</Label>
            <Input
              type="text"
              placeholder="e.g. National Hackathon 2026"
              value={form.eventName}
              onChange={set("eventName")}
            />
            <FieldError message={errors.eventName} />
          </div>

          <div>
            <Label required>Description</Label>
            <Textarea
              rows={4}
              placeholder="Describe the event — what it's about, what participants can expect..."
              value={form.description}
              onChange={set("description")}
            />
            <FieldError message={errors.description} />
          </div>

          <div>
            <Label required>Category</Label>
            <Select value={form.category} onChange={set("category")}>
              <option value="">Select a category</option>
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <FieldError message={errors.category} />
          </div>
        </Section>

        {/* Date, Time & Venue Updates */}
        <Section title="Schedule & Location">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={set("startDate")}
                min={isEditMode ? undefined : new Date().toISOString().split("T")[0]}
              />
              <FieldError message={errors.startDate} />
            </div>

            <div>
              <Label required>Start Time</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={set("startTime")}
              />
              <FieldError message={errors.startTime} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>End Date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={set("endDate")}
                min={form.startDate || new Date().toISOString().split("T")[0]}
              />
              <FieldError message={errors.endDate} />
            </div>

            <div>
              <Label required>End Time</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={set("endTime")}
              />
              <FieldError message={errors.endTime} />
            </div>
          </div>

          <div>
            <Label required>Venue</Label>
            <Input
              type="text"
              placeholder="e.g. Seminar Hall A, Lab 3, Open Air Stage"
              value={form.venue}
              onChange={set("venue")}
            />
            <FieldError message={errors.venue} />
          </div>
        </Section>

        {/* Eligibility Parameters */}
        <Section title="Eligibility Criteria">
          <p className="text-xs text-gray-400 -mt-2">
            Leave all unselected to keep the event open to everyone.
          </p>

          <div>
            <Label>Eligible Branches</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {BRANCHES.map((b) => (
                <TogglePill
                  key={b}
                  label={b}
                  selected={form.eligibleBranches.includes(b)}
                  onClick={() => toggleBranch(b)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Eligible Years</Label>
            <div className="flex gap-2 mt-1">
              {YEARS.map((y) => (
                <TogglePill
                  key={y}
                  label={`Year ${y}`}
                  selected={form.eligibleYears.includes(y)}
                  onClick={() => toggleYear(y)}
                />
              ))}
            </div>
          </div>
        </Section>

        {/* Tags */}
        <Section title="Tags">
          <p className="text-xs text-gray-400 -mt-2">
            Add relevant keywords to help students find this event.
          </p>

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g. hackathon, webdev, cloud"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <button
              type="button"
              onClick={addTag}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              <Plus size={13} /> Add
            </button>
          </div>

          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Banner Link Asset handling */}
        <Section title="Banner Image">
          <ImageUploadZone
            label="Banner Asset"
            value={form.banner}
            folder="event-banners"
            onChange={(uploadedUrl) =>
              setForm((prev) => ({ ...prev, banner: uploadedUrl }))
            }
          />
          <p className="text-xs text-gray-400 mt-1">
            This asset will automatically sync down through Cloudinary CDN.
          </p>
        </Section>

        {/* Submission Panel Form Interactions */}
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
            disabled={submitting}
            className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {submitting ? "Saving..." : isEditMode ? "Save Changes" : "Publish Event"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;