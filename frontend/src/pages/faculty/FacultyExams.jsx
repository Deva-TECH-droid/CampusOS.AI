import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, FileText, Users, Clock } from "lucide-react";
import { listFacultyExams } from "../../api/exam.api";

const STATUS_STYLE = {
  draft: "bg-gray-100 text-gray-500",
  pending_approval: "bg-amber-50 text-amber-600",
  rejected: "bg-red-50 text-red-600",
  upcoming: "bg-amber-50 text-amber-600",
  live: "bg-emerald-50 text-emerald-600",
  closed: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL = {
  draft: "draft",
  pending_approval: "pending approval",
  rejected: "rejected",
  upcoming: "upcoming",
  live: "live",
  closed: "closed",
};

const FacultyExams = () => {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    listFacultyExams()
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
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Tests &amp; Exams</h1>
          <p className="text-sm text-gray-500">Create tests and grade submissions</p>
        </div>
        <Link
          to="/faculty/exams/new"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={15} /> New exam
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <FileText size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No exams created yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {exams.map((exam) => (
            <Link
              key={exam._id}
              to={`/faculty/exams/${exam._id}`}
              className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{exam.title}</p>
                <p className="text-[11px] text-gray-400">
                  {exam.classroom?.className} · {exam.subject} · {exam.totalMarks} marks
                </p>
                {exam.status === "rejected" && exam.rejectionReason && (
                  <p className="text-[11px] text-red-500 mt-0.5">Rejected: {exam.rejectionReason}</p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Users size={12} /> {exam.submittedCount}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Clock size={12} />
                  {new Date(exam.scheduledAt).toLocaleString([], {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[exam.liveStatus]}`}>
                  {STATUS_LABEL[exam.liveStatus]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyExams;
