import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  ScanFace,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  getMyAttendance,
  getMyAttendanceStats,
} from "../../api/attendance.api";

const barColor = (pct) => {
  if (pct >= 85) return "bg-emerald-500";
  if (pct >= 75) return "bg-amber-500";
  return "bg-red-500";
};

const textColor = (pct) => {
  if (pct >= 85) return "text-emerald-600";
  if (pct >= 75) return "text-amber-600";
  return "text-red-600";
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const AttendanceHistory = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    Promise.all([getMyAttendanceStats(), getMyAttendance()])
      .then(([statsRes, recordsRes]) => {
        setStats(statsRes?.data?.data || null);
        setRecords(recordsRes?.data?.data?.records || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }

  const overall = stats?.overall;
  const subjects = stats?.subjects || [];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500">
            Your face check-in history and subject-wise percentage
          </p>
        </div>
        <Link
          to="/attendance"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
        >
          <ScanFace size={14} /> Check in
        </Link>
      </div>

      {/* Overall */}
      {overall && overall.total > 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-end justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Overall</span>
            <span className={`text-2xl font-semibold ${textColor(overall.percentage)}`}>
              {overall.percentage}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${barColor(overall.percentage)}`}
              style={{ width: `${Math.min(overall.percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Present {overall.present} of {overall.total} held periods
          </p>
          {overall.percentage < 75 && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600">
                You're below the 75% minimum attendance requirement.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <CalendarClock size={24} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No attendance history yet</p>
        </div>
      )}

      {/* Per-subject */}
      {subjects.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {subjects.map((s) => (
            <div key={s.subject} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{s.subject}</p>
                <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full ${barColor(s.percentage)}`}
                    style={{ width: `${Math.min(s.percentage, 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-semibold ${textColor(s.percentage)}`}>
                  {s.percentage}%
                </p>
                <p className="text-[11px] text-gray-400">
                  {s.present}/{s.total}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent check-ins */}
      <div>
        <h2 className="text-sm font-medium text-gray-900 mb-2">Recent check-ins</h2>
        {records.length === 0 ? (
          <p className="text-xs text-gray-400">No check-ins recorded yet.</p>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
            {records.slice(0, 25).map((r) => (
              <div key={r._id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate">{r.subject}</p>
                    <p className="text-[11px] text-gray-400">
                      {formatDate(r.date)} · {r.startTime}–{r.endTime}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-gray-400 flex-shrink-0">
                  {new Date(r.markedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;
