import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { getMyAnalysis } from "../../api/exam.api";

const ExamAnalysis = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyAnalysis(id)
      .then(({ data }) => setAnalysis(data?.data?.analysis || null))
      .catch((err) => setError(err?.response?.data?.message || "Couldn't load analysis."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link to="/exams" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900">
        <ArrowLeft size={13} /> Back to exams
      </Link>

      {error ? (
        <p className="text-sm text-gray-500 text-center py-16">{error}</p>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
            <p className="text-3xl font-semibold text-gray-900">{analysis.percentage}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {analysis.correctCount} correct · {analysis.incorrectCount} incorrect · {analysis.accuracy}% accuracy
            </p>
          </div>

          {analysis.strongTopics.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mb-1">
                <TrendingUp size={13} /> Strong topics
              </p>
              <p className="text-sm text-emerald-700">{analysis.strongTopics.join(", ")}</p>
            </div>
          )}

          {analysis.weakTopics.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-1">
                <TrendingDown size={13} /> Needs work
              </p>
              <p className="text-sm text-amber-700">{analysis.weakTopics.join(", ")}</p>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Topic-wise breakdown</h2>
            <div className="space-y-2">
              {analysis.topics.map((t) => (
                <div key={t.topic} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-28 truncate flex-shrink-0">{t.topic}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${t.accuracy >= 70 ? "bg-emerald-500" : t.accuracy >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${t.accuracy}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-16 text-right flex-shrink-0">
                    {t.correct}/{t.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExamAnalysis;
