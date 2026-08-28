import { useEffect, useState } from "react";
import { useNavigate, useParams ,Link} from "react-router-dom";
import { ArrowLeft, Paperclip, X ,ShieldAlert} from "lucide-react";
import { createNotice } from "../../api/notice.api";
import { getClassroom } from "../../api/classroom.api";
import { getClubDetails } from "../../api/club.api";
import { getEventById } from "../../api/event.api";
import { getDriveById } from "../../api/career.api";
import useAuth from "../../hooks/useAuth";

// ─── Config ────────────────────────────────────────────────────────────────────
// Schema targetType enum: "classroom" | "club" | "event" | "drive" | "platform"
const CATEGORIES = {
  classroom: {
    label: "Academic Notice",
    description:
      "For your classroom — class cancelled, room changed, exam rescheduled",
  },
  clubs: {
    label: "Club Notice",
    description:
      "Urgent update for club followers — meeting shifted, venue changed",
  },
  events: {
    label: "Event Notice",
    description:
      "Alert for registered students — venue changed, timing shifted",
  },
  drive: {
    // ← "drive" not "placement"
    label: "Placement Notice",
    description: "Drive update — deadline extended, test rescheduled",
  },
  platform: {
    label: "Platform Notice",
    description: "College-wide alert — maintenance, policy update",
  },
};

// Schema noticeType enum: announcement | update | deadline | schedule_change | result | reminder
const NOTICE_TYPES_BY_TARGET = {
  classroom: [
    {
      value: "schedule_change",
      label: "Cancellation",
      description: "A class is cancelled",
    },
    {
      value: "announcement",
      label: "Extra Class",
      description: "An extra class is scheduled",
    },
    {
      value: "schedule_change",
      label: "Room Change",
      description: "Venue or room has changed",
    },
    {
      value: "update",
      label: "Exam Update",
      description: "Exam rescheduled or changed",
    },
    {
      value: "announcement",
      label: "General",
      description: "Other academic update",
    },
  ],
  club: [
    {
      value: "schedule_change",
      label: "Venue Change",
      description: "Meeting location changed",
    },
    {
      value: "schedule_change",
      label: "Time Change",
      description: "Meeting time shifted",
    },
    {
      value: "announcement",
      label: "Cancellation",
      description: "Meeting or activity cancelled",
    },
    {
      value: "announcement",
      label: "General",
      description: "Other urgent club update",
    },
  ],
  event: [
    {
      value: "schedule_change",
      label: "Venue Change",
      description: "Event location changed",
    },
    {
      value: "schedule_change",
      label: "Time Change",
      description: "Event timing shifted",
    },
    {
      value: "announcement",
      label: "Cancellation",
      description: "Event or round cancelled",
    },
    {
      value: "update",
      label: "Round Update",
      description: "Round result or next round info",
    },
    {
      value: "announcement",
      label: "General",
      description: "Other urgent event update",
    },
  ],
  drive: [
    {
      value: "deadline",
      label: "Deadline Change",
      description: "Registration deadline extended or moved",
    },
    {
      value: "schedule_change",
      label: "Reschedule",
      description: "Test or interview rescheduled",
    },
    {
      value: "announcement",
      label: "Cancellation",
      description: "Drive or round cancelled",
    },
    {
      value: "result",
      label: "Result Update",
      description: "Shortlist or result announced",
    },
    {
      value: "reminder",
      label: "Reminder",
      description: "Reminder for students",
    },
    {
      value: "announcement",
      label: "General",
      description: "Other placement update",
    },
  ],
  platform: [
    {
      value: "announcement",
      label: "Announcement",
      description: "Important platform update",
    },
    {
      value: "update",
      label: "Maintenance",
      description: "Scheduled downtime or maintenance",
    },
    {
      value: "announcement",
      label: "General",
      description: "General platform notice",
    },
  ],
};

const PRIORITIES = [
  {
    value: "low",
    label: "Low",
    active: "bg-white text-gray-700 border-gray-400 ring-1 ring-gray-300",
  },
  {
    value: "normal",
    label: "Normal",
    active: "bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200",
  },
  {
    value: "high",
    label: "High",
    active: "bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-200",
  },
  {
    value: "urgent",
    label: "Urgent",
    active: "bg-red-50 text-red-700 border-red-300 ring-1 ring-red-200",
  },
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ─── Reusable field atoms ──────────────────────────────────────────────────────
const Label = ({ children, required, optional }) => (
  <label className="block text-xs font-medium text-gray-700 mb-1.5">
    {children}
    {required && <span className="text-red-400 ml-0.5">*</span>}
    {optional && (
      <span className="text-gray-400 font-normal ml-1">(optional)</span>
    )}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 placeholder:text-gray-300 transition-all"
  />
);

const SelectField = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-900 text-gray-700 transition-all"
  >
    {children}
  </select>
);

const Textarea = (props) => (
  <textarea
    {...props}
    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 placeholder:text-gray-300 transition-all resize-none leading-relaxed"
  />
);

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-500 mt-1">{message}</p> : null;

const Section = ({ title, children }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-50">
      {title}
    </h3>
    {children}
  </div>
);

// ─── Metadata sub-forms ────────────────────────────────────────────────────────
// These collect structured metadata that is never raw JSON from the user.
// Backend stores it in Notice.metadata (Mixed type).

const ClassroomMeta = ({ noticeLabel, meta, setMeta, errors }) => {
  const set = (key) => (e) => setMeta((p) => ({ ...p, [key]: e.target.value }));

  if (noticeLabel === "General" || noticeLabel === "Exam Update") return null;

  return (
    <>
      <div>
        <Label required>Subject</Label>
        <Input
          type="text"
          placeholder="e.g. DBMS, Operating Systems"
          value={meta.subject || ""}
          onChange={set("subject")}
        />
        <FieldError message={errors.subject} />
      </div>

      {noticeLabel === "Cancellation" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>Day</Label>
            <SelectField value={meta.day || ""} onChange={set("day")}>
              <option value="">Select day</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </SelectField>
            <FieldError message={errors.day} />
          </div>
          <div>
            <Label required>Class time</Label>
            <Input
              type="time"
              value={meta.startTime || ""}
              onChange={set("startTime")}
            />
            <FieldError message={errors.startTime} />
          </div>
        </div>
      )}

      {noticeLabel === "Extra Class" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Faculty</Label>
              <Input
                type="text"
                placeholder="e.g. Dr. Sharma"
                value={meta.faculty || ""}
                onChange={set("faculty")}
              />
              <FieldError message={errors.faculty} />
            </div>
            <div>
              <Label optional>Room</Label>
              <Input
                type="text"
                placeholder="e.g. Lab 3"
                value={meta.room || ""}
                onChange={set("room")}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label required>Date</Label>
              <Input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={meta.date || ""}
                onChange={set("date")}
              />
              <FieldError message={errors.date} />
            </div>
            <div>
              <Label required>Start time</Label>
              <Input
                type="time"
                value={meta.startTime || ""}
                onChange={set("startTime")}
              />
              <FieldError message={errors.startTime} />
            </div>
            <div>
              <Label required>End time</Label>
              <Input
                type="time"
                value={meta.endTime || ""}
                onChange={set("endTime")}
              />
              <FieldError message={errors.endTime} />
            </div>
          </div>
        </>
      )}

      {noticeLabel === "Room Change" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>New room</Label>
            <Input
              type="text"
              placeholder="e.g. Lab 4, Room 301"
              value={meta.newRoom || ""}
              onChange={set("newRoom")}
            />
            <FieldError message={errors.newRoom} />
          </div>
          <div>
            <Label required>Date</Label>
            <Input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={meta.date || ""}
              onChange={set("date")}
            />
            <FieldError message={errors.date} />
          </div>
        </div>
      )}
    </>
  );
};

const ClubEventMeta = ({ noticeLabel, meta, setMeta, errors }) => {
  const set = (key) => (e) => setMeta((p) => ({ ...p, [key]: e.target.value }));
  if (
    noticeLabel === "General" ||
    noticeLabel === "Cancellation" ||
    noticeLabel === "Round Update"
  )
    return null;

  return (
    <>
      {noticeLabel === "Venue Change" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label optional>Previous venue</Label>
            <Input
              type="text"
              placeholder="e.g. Seminar Hall A"
              value={meta.previousVenue || ""}
              onChange={set("previousVenue")}
            />
          </div>
          <div>
            <Label required>New venue</Label>
            <Input
              type="text"
              placeholder="e.g. Main Auditorium"
              value={meta.newVenue || ""}
              onChange={set("newVenue")}
            />
            <FieldError message={errors.newVenue} />
          </div>
        </div>
      )}
      {noticeLabel === "Time Change" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label optional>Previous time</Label>
            <Input
              type="time"
              value={meta.previousTime || ""}
              onChange={set("previousTime")}
            />
          </div>
          <div>
            <Label required>New time</Label>
            <Input
              type="time"
              value={meta.newTime || ""}
              onChange={set("newTime")}
            />
            <FieldError message={errors.newTime} />
          </div>
        </div>
      )}
    </>
  );
};

const DriveMeta = ({ noticeLabel, meta, setMeta, errors }) => {
  const set = (key) => (e) => setMeta((p) => ({ ...p, [key]: e.target.value }));
  if (
    noticeLabel === "General" ||
    noticeLabel === "Cancellation" ||
    noticeLabel === "Reminder"
  )
    return null;

  return (
    <>
      {(noticeLabel === "Deadline Change" || noticeLabel === "Reschedule") && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label optional>Previous date</Label>
            <Input
              type="date"
              value={meta.previousDate || ""}
              onChange={set("previousDate")}
            />
          </div>
          <div>
            <Label required>New date</Label>
            <Input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={meta.newDate || ""}
              onChange={set("newDate")}
            />
            <FieldError message={errors.newDate} />
          </div>
        </div>
      )}
      {noticeLabel === "Result Update" && (
        <div>
          <Label optional>Round</Label>
          <Input
            type="text"
            placeholder="e.g. OA, Technical Round 1, HR"
            value={meta.round || ""}
            onChange={set("round")}
          />
        </div>
      )}
    </>
  );
};

// ─── Validation ────────────────────────────────────────────────────────────────
const validateMeta = (targetType, noticeLabel, meta) => {
  const e = {};
  if (targetType === "classroom") {
    if (noticeLabel === "Cancellation") {
      if (!meta.subject) e.subject = "Required";
      if (!meta.day) e.day = "Required";
      if (!meta.startTime) e.startTime = "Required";
    }
    if (noticeLabel === "Extra Class") {
      if (!meta.subject) e.subject = "Required";
      if (!meta.faculty) e.faculty = "Required";
      if (!meta.date) e.date = "Required";
      if (!meta.startTime) e.startTime = "Required";
      if (!meta.endTime) e.endTime = "Required";
    }
    if (noticeLabel === "Room Change") {
      if (!meta.newRoom) e.newRoom = "Required";
      if (!meta.date) e.date = "Required";
    }
  }
  if (targetType === "club" || targetType === "event") {
    if (noticeLabel === "Venue Change" && !meta.newVenue)
      e.newVenue = "Required";
    if (noticeLabel === "Time Change" && !meta.newTime) e.newTime = "Required";
  }
  if (targetType === "drive") {
    if (
      (noticeLabel === "Deadline Change" || noticeLabel === "Reschedule") &&
      !meta.newDate
    )
      e.newDate = "Required";
  }
  return e;
};

// ─── Main component ────────────────────────────────────────────────────────────
// Route: /:targetType/:targetId/notices/create  (targetId absent for platform)
// Called from: ClassroomPage, ClubDetail, EventDetail, DriveDetail, AdminPanel
const CreateNotice = () => {
  const navigate = useNavigate();
  const { targetType, targetId } = useParams();
  const { user } = useAuth();

  const resolvedType = targetType || "platform";
  const categoryConfig = CATEGORIES[resolvedType] || CATEGORIES.platform;
  const typeOptions = NOTICE_TYPES_BY_TARGET[resolvedType] || NOTICE_TYPES_BY_TARGET.platform;

  // ─── Authorization States ───
  const [verifying, setVerifying] = useState(true); // Gatekeeper flag
  const [isAllowed, setIsAllowed] = useState(false); // Permission flag

  const [selectedTypeIdx, setSelectedTypeIdx] = useState(0);
  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "normal",
    expiresAt: "",
  });
  const [meta, setMeta] = useState({});
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const selectedType = typeOptions[selectedTypeIdx];

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        if (!targetType) {
          if (user.role === "superadmin") {
            setIsAllowed(true);
          }
          return;
        }

        if (user.role === "superadmin") {
          setIsAllowed(true);
          return;
        }

        let allowed = false;

        switch (targetType) {
          case "classroom": {
            const { data } = await getClassroom();
            allowed = data.data.isClassRep;
            break;
          }
          case "clubs": {
            const { data } = await getClubDetails(targetId);
            allowed = data.data.isAdmin;
            break;
          }
          case "events": {
            const { data } = await getEventById(targetId);
            allowed = data.data.isOrganizer;
            break;
          }
          case "drive": {
            allowed = user.role === "placementCoordinator";
            break;
          }
          default:
            allowed = false;
        }

        setIsAllowed(allowed);
      } catch (err) {
        console.error(err);
        setIsAllowed(false);
      } finally {
        setVerifying(false); // Lift the gatekeeper loading veil together
      }
    };

    verifyAccess();
  }, [targetType, targetId, user.role]);

  // ─── Guard Layout Renders ───
  
  // 1. Loading Skeleton Panel (Blocks the auth flash completely)
  if (verifying) {
    return (
      <div className="max-w-2xl mx-auto pb-10 animate-pulse space-y-6">
        <div className="w-16 h-4 bg-gray-100 rounded mt-4" />
        <div className="space-y-2">
          <div className="w-48 h-6 bg-gray-100 rounded" />
          <div className="w-full h-3 bg-gray-100 rounded" />
        </div>
        <div className="h-40 bg-white border border-gray-100 rounded-xl" />
        <div className="h-64 bg-white border border-gray-100 rounded-xl" />
      </div>
    );
  }

  // 2. Explicit Access Denied Screen
  if (!isAllowed) {
    return (
      <div className="max-w-md mx-auto my-20 bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-4 border border-red-100">
          <ShieldAlert size={22} />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1.5">Access Denied</h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-6">
          You do not have the required administrative permissions to publish a notice in this space. 
          If you believe this is an error, please contact your workspace coordinator.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={12} /> Go Back
          </button>
          <Link
            to="/"
            className="flex-1 px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // ─── Form Submission Logic ───
  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: "" }));
    setSubmitError("");
  };

  const handleTypeSelect = (idx) => {
    setSelectedTypeIdx(idx);
    setMeta({});
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.content.trim()) e.content = "Content is required.";
    return { ...e, ...validateMeta(resolvedType, selectedType.label, meta) };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await createNotice({
        title: form.title.trim(),
        content: form.content.trim(),
        targetType: resolvedType,
        targetId: targetId || null,
        noticeType: selectedType.value,
        priority: form.priority,
        metadata: meta,
        expiresAt: form.expiresAt || null,
        attachments,
      });

      const backRoutes = {
        classroom: `/academics/classroom/${targetId}`,
        clubs: `/community/clubs/${targetId}`,
        events: `/community/events/${targetId}`,
        drive: `/career/drives/${targetId}`,
        platform: "/",
      };
      
      navigate(backRoutes[resolvedType] || "/", {
        state: { toast: "Notice posted successfully." },
      });
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to post notice. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const priorityUrgentBanner = form.priority === "urgent";

  // 3. Regular Form Render (Only hits if isAllowed is explicitly true)
  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* ... keep your entire existing form JSX wrapper completely identical here ... */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={13} /> Back
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Post notice</h2>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {categoryConfig.label}
          </span>
        </div>
        <p className="text-xs text-gray-400">{categoryConfig.description}</p>
      </div>

      {priorityUrgentBanner && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-xs font-semibold text-red-700">Urgent</span>
          <span className="text-xs text-red-600">
            — this notice will be highlighted and shown at the top of feeds.
          </span>
        </div>
      )}

      {submitError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs text-red-700">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Section title="Notice type">
          <div className="grid grid-cols-2 gap-2">
            {typeOptions.map((type, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTypeSelect(idx)}
                className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                  selectedTypeIdx === idx
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                <p className="text-xs font-semibold">{type.label}</p>
                <p className={`text-xs mt-0.5 leading-snug ${selectedTypeIdx === idx ? "text-gray-300" : "text-gray-400"}`}>
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Notice details">
          <div>
            <Label required>Title</Label>
            <Input
              type="text"
              placeholder={
                selectedType.label === "Cancellation"
                  ? "e.g. DBMS class cancelled today"
                  : selectedType.label === "Venue Change"
                    ? "e.g. Hackathon moved to Main Auditorium"
                    : selectedType.label === "Deadline Change"
                      ? "e.g. Registration deadline extended to June 15"
                      : selectedType.label === "Result Update"
                        ? "e.g. OA shortlist published"
                        : "e.g. Important update"
              }
              value={form.title}
              onChange={set("title")}
            />
            <FieldError message={errors.title} />
          </div>

          <div>
            <Label required>Content</Label>
            <Textarea
              rows={4}
              placeholder="Provide full details — what changed, what students need to know or do..."
              value={form.content}
              onChange={set("content")}
            />
            <FieldError message={errors.content} />
          </div>

          <div>
            <Label>Priority</Label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, priority: p.value }))}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all duration-150 ${
                    form.priority === p.value
                      ? p.active
                      : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {selectedType.label !== "General" && selectedType.label !== "Announcement" && (
          <Section title="Specific details">
            {resolvedType === "classroom" && (
              <ClassroomMeta noticeLabel={selectedType.label} meta={meta} setMeta={setMeta} errors={errors} />
            )}
            {(resolvedType === "club" || resolvedType === "events") && (
              <ClubEventMeta noticeLabel={selectedType.label} meta={meta} setMeta={setMeta} errors={errors} />
            )}
            {resolvedType === "drive" && (
              <DriveMeta noticeLabel={selectedType.label} meta={meta} setMeta={setMeta} errors={errors} />
            )}
          </Section>
        )}

        <Section title="Attachments">
          <div className="flex items-center justify-center h-20 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <div className="flex items-center gap-2 text-gray-400">
              <Paperclip size={14} />
              <span className="text-xs">File upload — Cloudinary integration pending</span>
            </div>
          </div>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-700">
                  <Paperclip size={10} />
                  {a.name}
                  <button type="button" onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Timing">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label optional>Expires at</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={set("expiresAt")}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank to keep indefinitely</p>
            </div>
          </div>
        </Section>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting...
              </>
            ) : (
              "Post notice"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNotice;

