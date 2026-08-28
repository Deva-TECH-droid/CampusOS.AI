import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, X, Briefcase, ChevronRight, Plus, Clock } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import useDebounce from "../../hooks/useDebounce";
import { getAllDrives } from "../../api/career.api";

// ─── Helpers ──────────────────────────────────────────────────
const isOpenNow = (deadline) =>
  deadline ? new Date(deadline) >= new Date() : false;

const formatDeadline = (d) => {
  if (!d) return null;
  const diff = new Date(d) - new Date();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (days === 0) return { label: "Closes today", color: "text-red-500" };
  if (days === 1) return { label: "1 day left", color: "text-amber-500" };
  return { label: `${days}d left`, color: "text-gray-400" };
};

const jobTypeConfig = {
  internship: { label: "Internship", color: "bg-blue-50 text-blue-600" },
  fulltime: { label: "Full Time", color: "bg-violet-50 text-violet-600" },
};

const driveTypeLabel = {
  oncampus: "On Campus",
  offcampus: "Off Campus",
  poolcampus: "Pool Campus",
};

// ─── Drive Card ───────────────────────────────────────────────
// ─── Drive Card ───────────────────────────────────────────────
const DriveCard = ({ drive }) => {
  const open = isOpenNow(drive.registrationDeadline);
  const deadline = formatDeadline(drive.registrationDeadline);
  const jobCfg = jobTypeConfig[drive.jobType] || jobTypeConfig.fulltime;
  const pay = drive.jobType === "internship" ? drive.stipend : drive.ctc;

  return (
    <Link
      to={`/career/drives/${drive._id}`}
      className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl
        hover:border-gray-300 hover:shadow-sm transition-all duration-200 group"
    >
      {/* Logo */}
      <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {drive.companyLogo ? (
          <img
            src={drive.companyLogo}
            alt={drive.companyName}
            className="w-full h-full object-contain p-1.5"
          />
        ) : (
          <span className="text-xs font-bold text-gray-500">
            {drive.companyName?.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        {/* Row 1 */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {drive.companyName}
            </p>
            <p className="text-xs text-gray-500 mt-px truncate">{drive.role}</p>
          </div>

          {/* ✅ STATUS ROW: drive.hasApplied always displays "Registered" badge */}
          {drive.hasApplied ? (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 bg-blue-50 text-blue-700 border border-blue-100">
              Registered
            </span>
          ) : (
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${open ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}
            >
              {open ? "Open" : "Closed"}
            </span>
          )}
        </div>

        {/* Row 2 */}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${jobCfg.color}`}
            >
              {jobCfg.label}
            </span>
            {drive.driveType && (
              <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                {driveTypeLabel[drive.driveType]}
              </span>
            )}
            {drive.eligibleBranches?.length > 0 && (
              <span className="text-[10px] text-gray-400 hidden sm:inline">
                {drive.eligibleBranches.slice(0, 2).join(", ")}
                {drive.eligibleBranches.length > 2 &&
                  ` +${drive.eligibleBranches.length - 2}`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {pay && (
              <span className="text-xs font-semibold text-gray-700">{pay}</span>
            )}

            {/* ✅ Hide tracking countdown timelines if the student is already registered */}
            {!drive.hasApplied && deadline && (
              <div className="flex items-center gap-1">
                <Clock size={9} className={deadline.color} />
                <span className={`text-[10px] font-medium ${deadline.color}`}>
                  {deadline.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ChevronRight
        size={13}
        className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors"
      />
    </Link>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────
const Skeleton = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl animate-pulse"
      >
        <div className="w-11 h-11 bg-gray-100 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="flex justify-between">
            <div className="w-32 h-4 bg-gray-100 rounded" />
            <div className="w-12 h-4 bg-gray-100 rounded-full" />
          </div>
          <div className="w-48 h-3 bg-gray-100 rounded" />
          <div className="flex justify-between">
            <div className="flex gap-2">
              <div className="w-18 h-4 bg-gray-100 rounded-full" />
              <div className="w-18 h-4 bg-gray-100 rounded-full" />
            </div>
            <div className="w-16 h-3 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ─── Filter Pill ──────────────────────────────────────────────
const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150
      ${
        active
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-700"
      }`}
  >
    {label}
  </button>
);

// ─── Main ─────────────────────────────────────────────────────
const DrivesList = () => {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [status, setStatus] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [eligible, setEligible] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchDrives = useCallback(
    async (pageNumber = 1) => {
      setLoading(true);
      try {
        const res = await getAllDrives({
          ...(status !== "all" && { status }),
          ...(jobType !== "all" && { jobType }),
          ...(eligible && { eligibleOnly: "true" }),
          ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
          page: pageNumber,
          limit: 20,
        });

        const rawDrives = res.data.data.drives || [];

        setDrives(rawDrives);
        setPagination(res.data.data.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [status, jobType, eligible, debouncedSearch],
  );

  useEffect(() => {
    fetchDrives(1);
  }, [fetchDrives]);

  const isAdmin = ["superadmin", "placementCoordinator"].includes(user?.role);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Placement Drives
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? "Loading..." : `${pagination.total} drives available`}
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/career/drives/create"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={13} /> Create Drive
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72 mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg
            focus:outline-none focus:border-gray-400 placeholder:text-gray-300 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterPill
          label="All"
          active={status === "all"}
          onClick={() => setStatus("all")}
        />
        <FilterPill
          label="Open"
          active={status === "open"}
          onClick={() => setStatus(status === "open" ? "all" : "open")}
        />
        <FilterPill
          label="Closed"
          active={status === "closed"}
          onClick={() => setStatus(status === "closed" ? "all" : "closed")}
        />
        <span className="w-px bg-gray-200 self-stretch mx-1" />
        <FilterPill
          label="Internship"
          active={jobType === "internship"}
          onClick={() =>
            setJobType(jobType === "internship" ? "all" : "internship")
          }
        />
        <FilterPill
          label="Full Time"
          active={jobType === "fulltime"}
          onClick={() =>
            setJobType(jobType === "fulltime" ? "all" : "fulltime")
          }
        />
        <span className="w-px bg-gray-200 self-stretch mx-1" />
        <FilterPill
          label="Eligible Only"
          active={eligible}
          onClick={() => setEligible((p) => !p)}
        />
      </div>

      {/* List */}
      {loading ? (
        <Skeleton />
      ) : drives.length > 0 ? (
        <>
          <div className="space-y-2.5">
            {drives.map((drive) => (
              <DriveCard key={drive._id} drive={drive} />
            ))}
          </div>
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => fetchDrives(p)}
                    className={`w-8 h-8 text-xs font-semibold rounded-lg border transition-all
                    ${
                      p === pagination.page
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-xl">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Briefcase size={16} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">
            No drives found
          </p>
          <p className="text-xs text-gray-400">
            {search
              ? `No results for "${search}"`
              : "No drives match your filters"}
          </p>
        </div>
      )}
    </div>
  );
};

export default DrivesList;
