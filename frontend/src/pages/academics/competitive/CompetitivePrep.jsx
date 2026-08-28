import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
// Lucide icons from react-icons
import { 
  LuPlus, LuExternalLink, LuSearch, LuX, LuBookOpen, LuFileText, LuMap, LuVideo 
} from "react-icons/lu"
// Exact brand icons from react-icons
import { 
  SiYoutube, SiGithub, SiLeetcode, SiGeeksforgeeks 
} from "react-icons/si"
import useAuth from "../../../hooks/useAuth"

// ─── API calls ────────────────────────────────────────────────
// GET /api/competitive?category= → list resources by category
// POST /api/competitive → submit a resource

// ─── Config ───────────────────────────────────────────────────
const CATEGORIES = [
  { value: "dsa",          label: "DSA",           description: "Data Structures, Algorithms, Competitive Programming" },
  { value: "gate",         label: "GATE",          description: "GATE preparation, PYQs, roadmaps" },
  { value: "aptitude",     label: "Aptitude",      description: "Quant, Logical Reasoning, Verbal" },
  { value: "placements",   label: "Placements",    description: "Resume, OA prep, interview experiences" },
  { value: "higherStudies",label: "Higher Studies",description: "MS, GRE, TOEFL, research programs" },
]

const resourceTypeIcon = {
  roadmap:  LuMap,
  pyq:      LuFileText,
  playlist: LuVideo,        
  sheet:    LuFileText,
  book:     LuBookOpen,
  course:   LuVideo,        
  other:    LuExternalLink,
}

const resourceTypeColor = {
  roadmap:  "bg-blue-50 text-blue-700",
  pyq:      "bg-purple-50 text-purple-700",
  playlist: "bg-red-50 text-red-700",
  sheet:    "bg-green-50 text-green-700",
  book:     "bg-amber-50 text-amber-700",
  course:   "bg-orange-50 text-orange-700",
  other:    "bg-gray-100 text-gray-600",
}

// Maps platform names to their actual component packages and colors
const platformConfig = {
  YouTube: { icon: SiYoutube, color: "text-red-600" },
  GitHub:  { icon: SiGithub, color: "text-gray-900" },
  LeetCode: { icon: SiLeetcode, color: "text-orange-500" },
  GeeksforGeeks: { icon: SiGeeksforgeeks, color: "text-green-600" },
}

// ─── Resource Card ────────────────────────────────────────────
const ResourceCard = ({ resource }) => {
  const Icon = resourceTypeIcon[resource.type] || LuExternalLink
  const platform = platformConfig[resource.platform]
  const PlatformIcon = platform ? platform.icon : null

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all duration-200 group"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${resourceTypeColor[resource.type] || resourceTypeColor.other}`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 leading-snug">
            {resource.title}
          </h4>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${resourceTypeColor[resource.type] || resourceTypeColor.other}`}>
            {resource.type}
          </span>
        </div>
        {resource.description && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
            {resource.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          {resource.platform && (
            <span className={`text-xs font-medium flex items-center gap-1 ${platform ? platform.color : "text-gray-400"}`}>
              {PlatformIcon && <PlatformIcon size={12} />} {resource.platform}
            </span>
          )}
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <LuExternalLink size={10} /> Open
          </span>
        </div>
      </div>
    </a>
  )
}

// ─── Submit Resource Modal ────────────────────────────────────
const SubmitModal = ({ activeCategory, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    title: "", description: "", url: "",
    category: activeCategory || "dsa",
    type: "roadmap", platform: ""
  })
  const [submitting, setSubmitting] = useState(false)

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.url.trim()) return
    setSubmitting(true)
    try {
      // TODO: await submitCompetitiveResource(form)
      onSubmit?.()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Submit a Resource</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><LuX size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Title <span className="text-red-400">*</span></label>
            <input type="text" placeholder="e.g. Striver's A2Z DSA Sheet" value={form.title} onChange={set("title")}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Category</label>
              <select value={form.category} onChange={set("category")}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Type</label>
              <select value={form.type} onChange={set("type")}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400">
                {Object.keys(resourceTypeIcon).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">URL <span className="text-red-400">*</span></label>
            <input type="url" placeholder="https://" value={form.url} onChange={set("url")}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Platform</label>
              <input type="text" placeholder="e.g. YouTube, GitHub" value={form.platform} onChange={set("platform")}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Description</label>
            <textarea rows={3} placeholder="Brief description of this resource..." value={form.description} onChange={set("description")}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
const CompetitivePrep = () => {
  const [activeCategory, setActiveCategory] = useState("dsa")
  const [resources, setResources]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState("")
  const [showModal, setShowModal]           = useState(false)

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true)
      try {
        // TODO: const res = await axios.get(`/api/competitive?category=${activeCategory}`)
        // setResources(res.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchResources()
  }, [activeCategory])

  const filtered = resources.filter(r =>
    !search ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  )

  const activeCat = CATEGORIES.find(c => c.value === activeCategory)

  return (
    <div className="max-w-4xl mx-auto">
      {showModal && (
        <SubmitModal
          activeCategory={activeCategory}
          onClose={() => setShowModal(false)}
          onSubmit={() => {/* TODO: refetch */}}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Competitive Prep</h2>
          <p className="text-xs text-gray-400 mt-0.5">Curated resources for placement, GATE, and beyond</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <LuPlus size={13} /> Submit Resource
        </button>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`p-3 rounded-xl border text-left transition-all duration-150
              ${activeCategory === cat.value
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-100 hover:border-gray-300"
              }`}
          >
            <p className="text-xs font-semibold">{cat.label}</p>
          </button>
        ))}
      </div>

      {/* Active category description */}
      {activeCat && (
        <div className="mb-5">
          <p className="text-xs text-gray-400">{activeCat.description}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative w-full sm:w-72 mb-6">
        <LuSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search resources..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <LuX size={13} />
          </button>
        )}
      </div>

      {/* Resources grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3 p-4 bg-white border border-gray-100 rounded-xl animate-pulse">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-gray-100 rounded" />
                <div className="w-full h-3 bg-gray-100 rounded" />
                <div className="w-1/2 h-3 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(r => <ResourceCard key={r._id} resource={r} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-xl text-center">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <LuBookOpen size={16} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">No resources yet</p>
          <p className="text-xs text-gray-400">
            {search ? `No results for "${search}"` : `Be the first to submit a ${activeCat?.label} resource`}
          </p>
        </div>
      )}
    </div>
  )
}

export default CompetitivePrep;