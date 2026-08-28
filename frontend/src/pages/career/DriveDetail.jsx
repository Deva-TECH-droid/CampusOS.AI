import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  MapPin,
  CheckCircle2,
  Plus,
  Pencil,
  Clock,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { getDriveById, registerForDrive } from "../../api/career.api";
import NoticeFeed from "../../components/cards/NoticeFeed";

// ─── Helpers ──────────────────────────────────────────────────
const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

const formatDeadline = (d) => {
  if (!d) return null;
  const diff = new Date(d) - new Date();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (diff < 0)
    return { label: "Closed", color: "text-gray-400", urgent: false };
  if (days === 0)
    return { label: "Closes today", color: "text-red-600", urgent: true };
  if (days === 1)
    return { label: "1 day left", color: "text-amber-600", urgent: true };
  return { label: `${days} days left`, color: "text-gray-500", urgent: false };
};

const jobTypeConfig = {
  internship: { label: "Internship", color: "bg-blue-50 text-blue-700" },
  fulltime: { label: "Full Time", color: "bg-violet-50 text-violet-700" },
};

const driveTypeLabel = {
  oncampus: "On Campus",
  offcampus: "Off Campus",
  poolcampus: "Pool Campus",
};

// ─── Skeleton ─────────────────────────────────────────────────
const Skeleton = () => (
  <div className="max-w-3xl mx-auto animate-pulse space-y-4">
    <div className="w-16 h-3 bg-gray-100 rounded" />
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex gap-4">
          <div className="w-14 h-14 bg-gray-100 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="w-40 h-5 bg-gray-100 rounded" />
            <div className="w-24 h-3 bg-gray-100 rounded" />
            <div className="flex gap-2 pt-1">
              <div className="w-20 h-5 bg-gray-100 rounded-full" />
              <div className="w-20 h-5 bg-gray-100 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-50 p-6 flex justify-between">
        <div className="space-y-2">
          <div className="w-24 h-3 bg-gray-100 rounded" />
          <div className="w-32 h-6 bg-gray-100 rounded" />
        </div>
        <div className="w-28 h-3 bg-gray-100 rounded" />
      </div>
    </div>
  </div>
);

// ─── Sub-components ───────────────────────────────────────────
const InfoRow = ({ label, value }) =>
  value ? (
    <div className="flex items-start gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-36 flex-shrink-0 pt-px">
        {label}
      </span>
      <span className="text-xs font-medium text-gray-800">{value}</span>
    </div>
  ) : null;

const Section = ({ title, children, action }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5">
    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-50">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
    {children}
  </div>
);

// ─── Main ─────────────────────────────────────────────────────
const DriveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [drive, setDrive] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const driveRes = await getDriveById(id);
      const {
        drive: fetchedDrive,
        eligibility: fetchedEligibility,
        myApplication,
      } = driveRes.data.data;
      setDrive(fetchedDrive);
      setEligibility(fetchedEligibility);
      setApplication(myApplication);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApply = async () => {
    setApplying(true);
    setApplyError("");
    try {
      await registerForDrive(id);
      await fetchData();
    } catch (err) {
      setApplyError(
        err.response?.data?.message || "Failed to register. Try again.",
      );
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <Skeleton />;
  if (!drive)
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-sm text-gray-400 mb-3">Drive not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-gray-500 underline"
        >
          Go back
        </button>
      </div>
    );

  const isClosed = drive.registrationDeadline
    ? new Date(drive.registrationDeadline) < new Date()
    : true;
  const deadline = formatDeadline(drive.registrationDeadline);
  const jobCfg = jobTypeConfig[drive.jobType] || jobTypeConfig.fulltime;
  const isAdmin = ["superadmin", "placementCoordinator"].includes(user?.role);
  const hasApplied = !!application;
  const isEligible = eligibility ? eligibility.eligible : true;
  const ineligibilityReasons = eligibility ? eligibility.reasons : [];
  const canApply = isEligible && !hasApplied && !isClosed;
  const compensation =
    drive.jobType === "internship" ? drive.stipend : drive.ctc;
  const isPlacementAdmin =
    user?.role === "superadmin" || user?.role === "placementCoordinator";

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={13} /> Back
      </button>

      {/* ── Company header card ── */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div
              className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center
              justify-center flex-shrink-0 overflow-hidden"
            >
              {drive.companyLogo ? (
                <img
                  src={drive.companyLogo}
                  alt={drive.companyName}
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                <span className="text-lg font-bold text-gray-500">
                  {drive.companyName?.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-gray-900 leading-tight">
                    {drive.companyName}
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">{drive.role}</p>
                </div>
                {isAdmin && (
                  <Link
                    to={`/career/drives/${id}/edit`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border
                      border-gray-200 text-gray-600 rounded-lg hover:border-gray-400
                      hover:text-gray-900 transition-all flex-shrink-0"
                  >
                    <Pencil size={11} /> Edit
                  </Link>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full
                  ${isClosed ? "bg-gray-100 text-gray-400" : "bg-green-50 text-green-700"}`}
                >
                  {isClosed ? "Closed" : "Open"}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${jobCfg.color}`}
                >
                  {jobCfg.label}
                </span>
                {drive.driveType && (
                  <span
                    className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100
                    px-2.5 py-1 rounded-full"
                  >
                    {driveTypeLabel[drive.driveType]}
                  </span>
                )}
                {drive.location && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <MapPin size={9} /> {drive.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compensation + deadline bar */}
        <div className="border-t border-gray-50 px-5 py-4 flex items-center gap-6 bg-gray-50/50">
          {compensation && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                {drive.jobType === "internship" ? "Stipend" : "CTC"}
              </p>
              <p className="text-base font-bold text-gray-900 mt-0.5">
                {compensation}
              </p>
            </div>
          )}
          {compensation && drive.registrationDeadline && (
            <div className="w-px h-8 bg-gray-200" />
          )}
          {drive.registrationDeadline && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                Registration Deadline
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-semibold text-gray-800">
                  {formatDate(drive.registrationDeadline)}
                </p>
                {deadline && (
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${deadline.color}`}
                  >
                    <Clock size={10} /> {deadline.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Registration / Apply card ── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Your Status
            </p>
            {hasApplied ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-700">
                    Registered
                  </p>
                  <p className="text-xs text-green-600 capitalize mt-px">
                    {application.status?.replace("_", " ")}
                  </p>
                </div>
              </div>
            ) : isClosed ? (
              <p className="text-sm font-medium text-gray-400">
                Registration closed
              </p>
            ) : !isEligible ? (
              <p className="text-sm font-medium text-amber-600">Not eligible</p>
            ) : (
              <p className="text-sm font-medium text-gray-600">
                Not yet registered
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {hasApplied && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-100 rounded-xl">
                <CheckCircle2 size={13} className="text-green-600" />
                <span className="text-xs font-semibold text-green-700">
                  Registered
                </span>
              </div>
            )}

            {!hasApplied && !isClosed && !isEligible && (
              <div className="text-right">
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-xs font-medium text-gray-400">
                    Not Eligible
                  </p>
                </div>
                <div className="mt-1.5 space-y-0.5">
                  {ineligibilityReasons.map((r, i) => (
                    <p key={i} className="text-xs text-amber-600">
                      {r}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {canApply && (
              <div className="flex flex-col items-end gap-1.5">
                <a
                  href={drive.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleApply}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white
                    text-xs font-semibold rounded-xl hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink size={12} />
                  {applying ? "Processing..." : "Apply Now"}
                </a>
                {applyError && (
                  <p className="text-xs text-red-500">{applyError}</p>
                )}
                <p className="text-[10px] text-gray-400">
                  Opens external portal
                </p>
              </div>
            )}

            {drive.brochureUrl && (
              <a
                href={drive.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                <FileText size={11} /> View Brochure
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      {drive.description && (
        <Section title="About This Role">
          <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
            {drive.description}
          </p>
        </Section>
      )}

      {/* ── Job Details ── */}
      <Section title="Job Details">
        <InfoRow label="Role" value={drive.role} />
        <InfoRow label="Job Type" value={jobTypeConfig[drive.jobType]?.label} />
        <InfoRow label="Drive Type" value={driveTypeLabel[drive.driveType]} />
        {drive.jobType === "fulltime" && (
          <InfoRow label="CTC" value={drive.ctc} />
        )}
        {drive.jobType === "internship" && (
          <InfoRow label="Stipend" value={drive.stipend} />
        )}
        {drive.bond && <InfoRow label="Bond" value={drive.bond} />}
        {drive.location && <InfoRow label="Location" value={drive.location} />}
        {drive.batch && (
          <InfoRow label="Batch" value={`${drive.batch} graduates`} />
        )}
        {drive.slots && (
          <InfoRow label="Slots" value={`${drive.slots} positions`} />
        )}
      </Section>

      {/* ── Eligibility ── */}
      <Section title="Eligibility">
        <InfoRow
          label="Eligible Branches"
          value={
            drive.eligibleBranches?.length
              ? drive.eligibleBranches.join(", ")
              : "All branches"
          }
        />
        <InfoRow
          label="Min CGPA"
          value={drive.minCGPA > 0 ? `${drive.minCGPA}` : "No requirement"}
        />
        <InfoRow
          label="Max Backlogs"
          value={
            drive.maxBacklogs > 0
              ? `${drive.maxBacklogs}`
              : "No backlogs allowed"
          }
        />
        {drive.minYear && drive.maxYear && (
          <InfoRow
            label="Year"
            value={
              drive.minYear === drive.maxYear
                ? `Year ${drive.minYear}`
                : `Years ${drive.minYear} – ${drive.maxYear}`
            }
          />
        )}
      </Section>

      {/* ── Selection Process ── */}
      {drive.selectionProcess?.length > 0 && (
        <Section title="Selection Process">
          <div className="space-y-3">
            {drive.selectionProcess.map((round, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-white font-bold">
                    {round.order || i + 1}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800">
                  {round.name}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Drive Notices ── */}
      <Section
        title="Drive Notices"
        action={
          isPlacementAdmin && (
            <Link
              to={`/drive/${id}/create-notice`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all duration-150 backdrop-blur-md bg-white/80"
            >
              <Plus size={12} />
              Post Notice
            </Link>
          )
        }
      >
        <NoticeFeed
          targetType="drive" 
          targetId={id}
          canPost={isPlacementAdmin}
          showActions={isPlacementAdmin}
        />
      </Section>

      <div className="pb-8" />
    </div>
  );
};

export default DriveDetail;
