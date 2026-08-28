import { useState } from "react";
import {
  Pin,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Archive,
  Trash2,
  Megaphone,
  AlertTriangle,
  Clock,
  Award,
  Bell,
  RefreshCw,
} from "lucide-react";

const relativeTime = (d) => {
  if (!d) return "";
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

const typeConf = {
  announcement: {
    icon: Megaphone,
    label: "Announcement",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  update: {
    icon: RefreshCw,
    label: "Update",
    iconBg: "bg-blue-50 border border-blue-100",
    iconColor: "text-blue-600",
  },
  deadline: {
    icon: Clock,
    label: "Deadline",
    iconBg: "bg-rose-50 border border-rose-100",
    iconColor: "text-rose-600",
  },
  schedule_change: {
    icon: AlertTriangle,
    label: "Schedule Change",
    iconBg: "bg-amber-50 border border-amber-100",
    iconColor: "text-amber-600",
  },
  result: {
    icon: Award,
    label: "Result",
    iconBg: "bg-emerald-50 border border-emerald-100",
    iconColor: "text-emerald-600",
  },
  reminder: {
    icon: Bell,
    label: "Reminder",
    iconBg: "bg-purple-50 border border-purple-100",
    iconColor: "text-purple-600",
  },
};

const priorityConf = {
  urgent: {
    dot: "bg-rose-500",
    bar: "bg-rose-500",
    row: "bg-rose-50/60 border-rose-200/80 shadow-xs",
    badge: "bg-rose-600 text-white animate-pulse",
    label: "Urgent Alert",
  },
  high: {
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    row: "bg-amber-50/60 border-amber-200/80 shadow-2xs",
    badge: "bg-amber-600 text-white",
    label: "High Priority",
  },
  normal: {
    dot: "bg-slate-400",
    bar: "bg-slate-300",
    row: "bg-white border-slate-200/80 shadow-2xs",
    badge: null,
    label: "",
  },
  low: {
    dot: "bg-slate-300",
    bar: "bg-slate-200",
    row: "bg-slate-50/40 border-slate-200/60 opacity-90",
    badge: null,
    label: "",
  },
};

const NoticeCard = ({
  notice,
  canManage,
  onPin,
  onArchive,
  onDelete,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(notice.isPinned);
  const [busy, setBusy] = useState(false);

  const tc = typeConf[notice.noticeType] ?? typeConf.announcement;
  const pc = priorityConf[notice.priority] ?? priorityConf.normal;
  const Icon = tc.icon;
  const isAlert = notice.priority === "urgent" || notice.priority === "high";

  const act = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch {
    } finally {
      setBusy(false);
    }
  };

  if (compact) {
    return (
      <div
        className={`border-b border-slate-100/80 last:border-0 transition-all ${busy ? "opacity-40" : ""}`}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-start gap-3 py-3 text-left group"
        >
          {/* Priority Dot Indicator aligned nicely to the top row */}
          <div
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${pc.dot} ${isAlert ? "scale-110 shadow-xs" : ""}`}
          />

          <div className="flex-1 min-w-0">
            {/* Row 1: Badges and Title */}
            <div className="flex items-start gap-1.5 min-w-0">
              {isAlert && pc.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase flex-shrink-0 mt-0.5 ${pc.badge}`}
                >
                  {pc.label.split(" ")[0]}
                </span>
              )}

              <p
                className={`text-xs text-slate-800 break-words transition-colors group-hover:text-slate-900 ${isPinned || isAlert ? "font-semibold" : "font-medium"}`}
              >
                {notice.title}
              </p>
            </div>

            {/* Row 2: Type Label AND Populated Source Name stacked neatly underneath */}
            <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-slate-400 font-medium">
              <span>{tc.label}</span>

              {notice.targetId && typeof notice.targetId === "object" && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-blue-600 bg-blue-50/60 border border-blue-100/40 px-1.5 py-0.5 rounded">
                    {notice.targetType === "clubs" && notice.targetId.clubName}
                    {notice.targetType === "events" &&
                      notice.targetId.eventName}
                    {(notice.targetType === "drive" ||
                      notice.targetType === "drives") &&
                      notice.targetId.companyName}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right Edge Action Alignments */}
          <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
            <span className="text-[10px] text-slate-400 font-mono font-medium bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
              {relativeTime(notice.createdAt)}
            </span>
            <ChevronDown
              size={12}
              className={`text-slate-300 group-hover:text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {open && (
          <div className="ml-4 pb-3.5 space-y-2.5 overflow-hidden animate-in fade-in duration-150">
            {notice.content && (
              <p className="text-xs text-slate-600 leading-relaxed break-words whitespace-pre-line bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                {notice.content}
              </p>
            )}

            {notice.metadata && Object.keys(notice.metadata).length > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 space-y-1">
                {Object.entries(notice.metadata).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs">
                    <span className="text-slate-400 font-medium capitalize min-w-[75px] text-[11px]">
                      {k.replace(/([A-Z])/g, " $1")}
                    </span>
                    <span className="text-slate-700 font-semibold text-[11px]">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {notice.attachments?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {notice.attachments.map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:border-slate-400 hover:text-slate-800 transition-colors shadow-3xs"
                  >
                    <Paperclip size={10} className="text-slate-400" />{" "}
                    <span className="max-w-[120px] truncate">{f.name}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium">
                {notice.createdBy
                  ? `By ${notice.createdBy.firstName} ${notice.createdBy.lastName}`
                  : ""}
              </span>
              {canManage && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      act(async () => {
                        await onPin?.(notice._id);
                        setIsPinned((p) => !p);
                      });
                    }}
                    className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${isPinned ? "text-slate-900 font-semibold" : "text-slate-400 hover:text-slate-700"}`}
                  >
                    <Pin size={10} className={isPinned ? "fill-current" : ""} />{" "}
                    {isPinned ? "Pinned" : "Pin"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      act(() => onArchive?.(notice._id));
                    }}
                    className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Archive size={10} /> Archive
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      act(() => onDelete?.(notice._id));
                    }}
                    className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── 2. FULL PAGE VIEW (Classrooms / Dynamic Dashboards) ───────────────────
  return (
    <div
      className={`relative border rounded-xl overflow-hidden transition-all duration-200 max-w-4xl w-full ${pc.row} ${busy ? "opacity-40 pointer-events-none" : ""}`}
    >
      {/* Solid Left Priority Accent Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${pc.bar}`} />

      <div className="pl-5 pr-5 py-4">
        {/* Top Header Row: Icon, Type, Badges, and Time cleanly separated */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-3xs bg-white ${tc.iconBg}`}
            >
              <Icon size={13} className={tc.iconColor} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {tc.label}
            </span>
            {isPinned && (
              <Pin
                size={10}
                className="text-slate-400 fill-slate-400/20 flex-shrink-0"
              />
            )}
            {isAlert && pc.badge && (
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-3xs flex-shrink-0 ${pc.badge}`}
              >
                {pc.label}
              </span>
            )}
          </div>

          {/* Timestamp cleanly aligned on the right edge */}
          <span className="text-[10px] text-slate-400 font-mono font-medium bg-white/80 border border-slate-200/60 px-2 py-0.5 rounded shadow-3xs flex-shrink-0">
            {relativeTime(notice.createdAt)}
          </span>
        </div>

        {/* Content Body Layout */}
        <div className="max-w-3xl">
          <h4 className="text-sm font-bold text-slate-900 leading-snug tracking-tight mb-1.5">
            {notice.title}
          </h4>

          {notice.content && (
            <p
              className={`text-xs text-slate-600 leading-relaxed break-words ${open ? "whitespace-pre-line" : "line-clamp-2"}`}
            >
              {notice.content}
            </p>
          )}
        </div>

        {/* Action Toggle Button */}
        {(notice.content?.length > 120 ||
          notice.attachments?.length > 0 ||
          canManage) && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 mt-3 px-2.5 py-1 bg-white border border-slate-200 shadow-3xs rounded-md transition-all"
          >
            {open ? (
              <>
                <ChevronUp size={10} /> Hide Details
              </>
            ) : (
              <>
                <ChevronDown size={10} /> View Full Details
              </>
            )}
          </button>
        )}
      </div>

      {/* Accordion Expansion Drawer Section */}
      {open && (
        <div className="mx-5 mb-4 space-y-3 pt-3.5 border-t border-slate-200/60 animate-in fade-in duration-200">
          {notice.metadata && Object.keys(notice.metadata).length > 0 && (
            <div className="bg-white/90 border border-slate-200/80 shadow-3xs rounded-xl px-4 py-3 space-y-1.5 max-w-2xl">
              {Object.entries(notice.metadata).map(([k, v]) => (
                <div
                  key={k}
                  className="flex gap-4 text-xs border-b border-slate-50 last:border-0 pb-1 last:pb-0"
                >
                  <span className="text-slate-400 font-medium capitalize min-w-[90px]">
                    {k.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="text-slate-800 font-semibold">
                    {String(v)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {notice.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {notice.attachments.map((f, i) => (
                <a
                  key={i}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:border-slate-400 hover:text-slate-900 transition-all shadow-3xs"
                >
                  <Paperclip size={11} className="text-slate-400" />{" "}
                  <span className="max-w-[180px] truncate">{f.name}</span>
                </a>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <span className="text-[10px] font-medium text-slate-400">
              {notice.createdBy
                ? `Posted by ${notice.createdBy.firstName} ${notice.createdBy.lastName}`
                : ""}
            </span>
            {canManage && (
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    act(async () => {
                      await onPin?.(notice._id);
                      setIsPinned((p) => !p);
                    });
                  }}
                  className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${isPinned ? "text-slate-900" : "text-slate-400 hover:text-slate-700"}`}
                >
                  <Pin size={10} className={isPinned ? "fill-current" : ""} />{" "}
                  {isPinned ? "Pinned" : "Pin Notice"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    act(() => onArchive?.(notice._id));
                  }}
                  className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Archive size={10} /> Archive
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    act(() => onDelete?.(notice._id));
                  }}
                  className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={10} /> Delete Notice
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeCard;
