import { useEffect, useState } from "react";
import { Clock, Calendar, School, BookOpen, Loader2, Sparkles, MapPin } from "lucide-react";
import { getMyTimetable } from "../../api/faculty.api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FacultyTimetable() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ today: "Monday", todaySchedule: [], weeklySchedule: {} });
  const [activeTab, setActiveTab] = useState("today"); // "today" or "weekly"
  const [selectedDay, setSelectedDay] = useState("Monday");

  useEffect(() => {
    getMyTimetable()
      .then(({ data: res }) => {
        const payload = res?.data || {};
        setData(payload);
        setSelectedDay(payload.today || "Monday");
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }

  const { today, todaySchedule, weeklySchedule } = data;
  const currentViewList =
    activeTab === "today" ? todaySchedule : weeklySchedule[selectedDay] || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock size={20} className="text-indigo-600" />
            Teacher Timetable
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Your assigned classes and teaching periods scheduled by the administrator
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("today")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "today"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Today's Timetable ({today})
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "weekly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Weekly Schedule
          </button>
        </div>
      </div>

      {/* Day Selector for Weekly tab */}
      {activeTab === "weekly" && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DAYS.map((day) => {
            const count = (weeklySchedule[day] || []).length;
            const isToday = day === today;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-medium shrink-0 transition-all border ${
                  selectedDay === day
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
                }`}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedDay === day ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
                {isToday && (
                  <span className="ml-1 text-[9px] text-emerald-400 font-bold">•</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Schedule Cards Grid */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-50 pb-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Calendar size={15} className="text-gray-400" />
            {activeTab === "today" ? `Today's Schedule (${today})` : `${selectedDay}'s Classes`}
          </h2>
          <span className="text-xs text-gray-400">
            {currentViewList.length} {currentViewList.length === 1 ? "period" : "periods"} assigned
          </span>
        </div>

        {currentViewList.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No classes assigned for this day. Enjoy your free hours!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {currentViewList.map((period, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50/70 to-white hover:border-gray-200 transition-all shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 flex items-center gap-1.5">
                    <Clock size={12} />
                    {period.startTime} – {period.endTime}
                  </span>
                  <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                    <School size={13} className="text-gray-400" />
                    {period.className}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-emerald-600" />
                    {period.subject}
                  </h3>
                  {period.room && (
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={11} className="text-gray-400" />
                      Room: {period.room}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
