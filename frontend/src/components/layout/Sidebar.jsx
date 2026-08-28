import { useState, useEffect } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Users, BookOpen, Briefcase,
  ShieldCheck, UserCircle, GraduationCap, School,
  Trophy, MessageSquare, BarChart2, FileText,
  ListChecks, ChevronDown, Globe, CalendarDays,
  X, ScanFace, History, ClipboardCheck, PenSquare, Sparkles
} from "lucide-react"
import useAuth from "../../hooks/useAuth"

// ─── Nav config ───────────────────────────────────────────────
const getMainNav = (user) => [
  {
    label: "Dashboard",
    path:  "/",
    icon:  LayoutDashboard,
  },
  {
    label: "Clubs",
    path:  "https://campus-os-1.onrender.com/?utm_source=chatgpt.com",
    icon:  Users,
    external: true,
  },
  {
    label: "Events",
    path:  "/community/events",
    icon:  CalendarDays,
  },
  {
    label: "Attendance",
    path:  "/attendance",
    icon:  ScanFace,
    base:  "/attendance",
    children: [
      { label: "Check In", path: "/attendance",         icon: ScanFace, exact: true },
      { label: "History",  path: "/attendance/history", icon: History },
      ...(["classrep", "faculty", "superadmin"].includes(user?.role)
        ? [{ label: "Kiosk Mode", path: "/attendance/kiosk", icon: ClipboardCheck }]
        : []),
    ],
  },
  ...(user?.role === "faculty"
    ? [
        {
          label: "Faculty Portal",
          path:  "/faculty",
          icon:  ClipboardCheck,
          base:  "/faculty",
          children: [
            { label: "Attendance",   path: "/faculty",             icon: ClipboardCheck, exact: true },
            { label: "Exams",        path: "/faculty/exams",       icon: PenSquare },
            { label: "Assignments",  path: "/faculty/assignments", icon: FileText },
            { label: "Notes",        path: "/faculty/notes",       icon: BookOpen },
          ],
        },
      ]
    : []),
  ...(["student", "classrep"].includes(user?.role)
    ? [
        {
          label: "Coursework",
          path:  "/exams",
          icon:  PenSquare,
          base:  "/exams",
          children: [
            { label: "Exams",       path: "/exams",       icon: PenSquare, exact: true },
            { label: "Assignments", path: "/assignments", icon: FileText },
            { label: "Notes",       path: "/notes",       icon: BookOpen },
          ],
        },
      ]
    : []),
  { label: "Alumni", path: "/alumni", icon: Sparkles },
  {
    label: "Academics",
    path:  user?.classroom
      ? `/academics/classroom/${user.classroom}`
      : "/academics/competitive",
    icon:  BookOpen,
    base:  "/academics",
    children: [
      {
        label: "Classroom",
        path:  user?.classroom
          ? `/academics/classroom/${user.classroom}`
          : "/academics/classroom/unassigned",
        icon: School,
      },
      { label: "Competitive Prep", path: "/academics/competitive", icon: Trophy },
    ],
  },
  {
    label: "Discussions",
    path:  "/discussions",
    icon:  MessageSquare,
  },
  {
    label: "Career",
    path:  "/career",
    icon:  Briefcase,
    base:  "/career",
    children: [
      { label: "Overview",         path: "/career",                  icon: BarChart2,  exact: true },
      { label: "Drives",           path: "/career/drives",           icon: ListChecks },
      { label: "My Applications",  path: "/career/my-applications",  icon: FileText },
    ],
  },
]

const bottomNav = [
  { label: "Admin",   path: "/admin",   icon: ShieldCheck, adminOnly: true },
  { label: "Profile", path: "/profile", icon: UserCircle },
]

// ─── Sidebar ──────────────────────────────────────────────────
const Sidebar = ({ isOpen, onClose }) => {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const mainNav      = getMainNav(user)

  // Track which dropdowns are open — keyed by label
  const [openDropdowns, setOpenDropdowns] = useState(() => {
    // Auto-open the dropdown for the current active section on mount
    const initial = {}
    mainNav.forEach(item => {
      if (item.base && pathname.startsWith(item.base)) {
        initial[item.label] = true
      }
    })
    return initial
  })

  // Auto-open dropdown when navigating to a section
  useEffect(() => {
    mainNav.forEach(item => {
      if (item.base && pathname.startsWith(item.base)) {
        setOpenDropdowns(prev => ({ ...prev, [item.label]: true }))
      }
    })
  }, [pathname])

  const toggleDropdown = (label) => {
    setOpenDropdowns(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const handleNavClick = (item, e) => {
    if (!item.children) {
      onClose?.()
      return
    }
    // If dropdown has children and sidebar is open — toggle dropdown, navigate to parent
    if (isOpen) {
      toggleDropdown(item.label)
      // Only navigate if not already in this section
      const base = item.base || item.path
      if (!pathname.startsWith(base)) {
        navigate(item.path)
      } else {
        e.preventDefault()
      }
    } else {
      // Sidebar collapsed — just navigate, don't show dropdown
      navigate(item.path)
    }
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-40 flex flex-col transition-all duration-300
        ${isOpen ? "w-64" : "w-16"}
      `}
    >
      {/* ── Logo + close (mobile) ── */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 overflow-hidden flex-shrink-0">
        <div className="flex-shrink-0 w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <GraduationCap size={16} className="text-white" />
        </div>
        {isOpen && (
          <>
            <span className="font-semibold text-gray-900 text-sm tracking-tight whitespace-nowrap flex-1">
              EventSphere
            </span>
            {/* Close button visible only on mobile */}
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>

      {/* ── Main nav ── */}
      <nav className="flex-1 py-4 flex flex-col gap-0.5 px-2 overflow-y-auto">
        {mainNav.map((item) => {
          const { label, path, icon: Icon, children, base } = item
          const baseSeg   = base || path.split("/").slice(0, 2).join("/")
          const isActive  = path === "/" ? pathname === "/" : pathname.startsWith(baseSeg)
          const isExpanded = isOpen && children && openDropdowns[label]

          return (
            <div key={label}>
              {/* Parent item */}
              <div className="flex items-center gap-1">
                {item.external ? (
                  <a
                    href={path}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 flex-1 min-w-0 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {isOpen && <span className="whitespace-nowrap truncate">{label}</span>}
                  </a>
                ) : (
                <NavLink
                  to={path}
                  end={path === "/"}
                  onClick={(e) => handleNavClick(item, e)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 flex-1 min-w-0
                    ${isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {isOpen && <span className="whitespace-nowrap truncate">{label}</span>}
                </NavLink>
                )}

                {/* Dropdown arrow — only show when sidebar is open and item has children */}
                {isOpen && children && (
                  <button
                    onClick={(e) => { e.preventDefault(); toggleDropdown(label) }}
                    className={`p-1.5 rounded-lg transition-all duration-150 flex-shrink-0
                      ${isActive
                        ? "text-white hover:bg-white/10"
                        : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    aria-label={`Toggle ${label}`}
                  >
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </div>

              {/* Children — animated expand */}
              {isExpanded && (
                <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-gray-100 pl-3">
                  {children.map(({ label: childLabel, path: childPath, icon: ChildIcon, exact, disabled }) => {
                    if (!childPath) return null

                    const isChildActive = exact
                      ? pathname === childPath
                      : pathname.startsWith(childPath) && childPath !== "/career" && childPath !== "/community"
                        ? true
                        : pathname === childPath

                    return (
                      <NavLink
                        key={childLabel}
                        to={disabled ? "#" : childPath}
                        end={exact}
                        onClick={() => onClose?.()}
                        className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-150
                          ${isChildActive && !disabled
                            ? "text-gray-900 bg-gray-100"
                            : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                          }
                          ${disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}
                        `}
                      >
                        <ChildIcon size={13} className="flex-shrink-0" />
                        <span className="whitespace-nowrap">{childLabel}</span>
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Bottom nav ── */}
      <div className="py-4 flex flex-col gap-0.5 px-2 border-t border-gray-100 flex-shrink-0">
        {bottomNav.map(({ label, path, icon: Icon, adminOnly }) => {
          if (adminOnly && !["superadmin", "placementCoordinator"].includes(user?.role)) return null
          return (
            <NavLink
              key={label}
              to={path}
              onClick={() => onClose?.()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {isOpen && <span className="whitespace-nowrap">{label}</span>}
            </NavLink>
          )
        })}
      </div>
    </aside>
  )
}

export default Sidebar