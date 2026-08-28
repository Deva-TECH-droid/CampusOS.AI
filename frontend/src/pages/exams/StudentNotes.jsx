import { useEffect, useState } from "react";
import { Loader2, BookOpen, Download } from "lucide-react";
import { listMyNotes } from "../../api/note.api";

const StudentNotes = () => {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    listMyNotes()
      .then(({ data }) => setNotes(data?.data?.notes || []))
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
        <h1 className="text-lg font-semibold text-gray-900">Notes &amp; Study Material</h1>
        <p className="text-sm text-gray-500">Material shared by your teachers</p>
      </div>

      {notes.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <BookOpen size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No notes shared yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {notes.map((n) => (
            <a
              key={n._id}
              href={n.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-900 truncate">{n.title}</p>
                <p className="text-[11px] text-gray-400">
                  {n.subject} · {n.faculty?.firstName} {n.faculty?.lastName}
                </p>
                {n.description && <p className="text-xs text-gray-500 mt-0.5">{n.description}</p>}
              </div>
              <Download size={15} className="text-gray-400 flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNotes;
