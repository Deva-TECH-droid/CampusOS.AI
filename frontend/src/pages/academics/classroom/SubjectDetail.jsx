import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
// Lucide icons via react-icons
import { 
  LuArrowLeft, LuExternalLink, LuBookOpen, LuUser, LuFileText, LuMap, LuVideo 
} from "react-icons/lu"
import useAuth from "../../../hooks/useAuth"

// ─── API calls ────────────────────────────────────────────────
// GET /api/classroom/subject/:name?branch=&semester= → subject detail with resources

const resourceTypeIcon = {
  roadmap:  LuMap,
  pyq:      LuFileText,
  playlist: LuVideo, // Replaced explicit Youtube icon with a generic Video icon
  sheet:    LuFileText,
  book:     LuBookOpen,
  other:    LuExternalLink,
}

const resourceTypeColor = {
  roadmap:  "bg-blue-50 text-blue-700",
  pyq:      "bg-purple-50 text-purple-700",
  playlist: "bg-red-50 text-red-700",
  sheet:    "bg-green-50 text-green-700",
  book:     "bg-amber-50 text-amber-700",
  other:    "bg-gray-100 text-gray-600",
}

const SubjectDetail = () => {
  const { name } = useParams()
  const navigate = useNavigate()
  const subject = decodeURIComponent(name)

  // TODO: fetch subject detail from API
  // GET /api/classroom/subject/:name → { faculty, resources, syllabus, importantTopics, referenceBooks }
  const data = null

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <LuArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{subject}</h1>
            {data?.faculty && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                <LuUser size={12} /> {data.faculty}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Resources</h2>
        {data?.resources?.length > 0 ? (
          <div className="space-y-2">
            {data.resources.map((r, i) => {
              const Icon = resourceTypeIcon[r.type] || LuExternalLink
              return (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-300 transition-all group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${resourceTypeColor[r.type] || resourceTypeColor.other}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{r.title}</p>
                    {r.platform && <p className="text-xs text-gray-400">{r.platform}</p>}
                  </div>
                  <LuExternalLink size={12} className="text-gray-300 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                </a>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
            No resources added yet.
          </p>
        )}
      </div>

      {/* Syllabus */}
      {data?.syllabus && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Syllabus</h2>
          <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{data.syllabus}</p>
        </div>
      )}

      {/* Important Topics */}
      {data?.importantTopics?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Important Topics</h2>
          <div className="flex flex-wrap gap-2">
            {data.importantTopics.map((topic, i) => (
              <span key={i} className="text-xs font-medium px-2.5 py-1 bg-gray-50 border border-gray-100 text-gray-700 rounded-full">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reference Books */}
      {data?.referenceBooks?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Reference Books</h2>
          <div className="space-y-2">
            {data.referenceBooks.map((book, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <LuBookOpen size={13} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-700">{book}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Placeholder when no data */}
      {!data && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <p className="text-xs text-gray-400">
            Subject details will appear here once connected to the backend.
          </p>
        </div>
      )}
    </div>
  )
}

export default SubjectDetail;