import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, FileText, Clock } from "lucide-react";
import { listMyExams } from "../../api/exam.api";

const STATUS_STYLE = {
  upcoming: "bg-amber-50 text-amber-600",
  live: "bg-emerald-50 text-emerald-600",
  closed: "bg-gray-100 text-gray-500",
};

const StudentExams = () => {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    listMyExams()
      .then(({ data }) => setExams(data?.data?.exams || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Tests &amp; Exams</h1>
        <p className="text-sm text-gray-500">Tests scheduled for your class</p>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <FileText size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No exams scheduled right now.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {exams.map((exam) => {
            const submitted = exam.mySubmission && exam.mySubmission.status !== "in_progress";
            const canTake = exam.liveStatus === "live" && !submitted;

            return (
              <div key={exam._id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{exam.title}</p>
                  <p className="text-[11px] text-gray-400">
                    {exam.subject} · {exam.totalMarks} marks · {exam.durationMinutes} min
                  </p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock size={11} />
                    {new Date(exam.scheduledAt).toLocaleString([], {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {exam.mySubmission?.finalScore != null ? (
                    <Link
                      to={`/exams/${exam._id}/analysis`}
                      className="text-sm font-semibold text-gray-900 hover:underline underline-offset-2"
                    >
                      {exam.mySubmission.finalScore}/{exam.totalMarks}
                    </Link>
                  ) : (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[exam.liveStatus]}`}>
                      {submitted ? "submitted" : exam.liveStatus}
                    </span>
                  )}
                  {canTake && (
                    <Link
                      to={`/exams/${exam._id}/take`}
                      className="text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg px-3 py-1.5"
                    >
                      Start
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentExams;
