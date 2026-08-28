import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, X, AlertTriangle } from "lucide-react"
import { createDrive } from "../../api/career.api"

// ─── Constants ────────────────────────────────────────────────
const BRANCHES = ["CSE", "ECE", "EEE", "ME", "CE", "IT", "CHEM", "BIO"]

const JOB_TYPES = [
  { value: "internship", label: "Internship" },
  { value: "fulltime", label: "Full-Time" }
]

const DRIVE_TYPES = [
  { value: "oncampus", label: "On-Campus" },
  { value: "offcampus", label: "Off-Campus" },
  { value: "poolcampus", label: "Pool Campus" }
]

// ─── Field Components ─────────────────────────────────────────
const Label = ({ children, required, optional }) => (
  <label className="block text-xs font-medium text-gray-700 mb-1.5">
    {children}
    {required && <span className="text-red-400 ml-0.5">*</span>}
    {optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
  </label>
)

const Input = (props) => (
  <input
    {...props}
    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300 transition-colors"
  />
)

const Select = (props) => (
  <select
    {...props}
    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors bg-no-repeat appearance-none"
  />
)

const Textarea = (props) => (
  <textarea
    {...props}
    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300 transition-colors resize-none"
  />
)

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-400 mt-1.5">{message}</p> : null

const Section = ({ title, subtitle, children }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4">
    <div className="pb-2 border-b border-gray-50">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
)

const TogglePill = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150
      ${selected
        ? "bg-gray-900 text-white border-gray-900"
        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
      }`}
  >
    {label}
  </button>
)

// ─── Main ─────────────────────────────────────────────────────
const CreateDrive = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    companyName: "",
    companyLogo: "",
    role: "",
    description: "",
    jobType: "fulltime",
    driveType: "oncampus",
    location: "",
    ctc: "",
    stipend: "",
    bond: "",
    batch: "",
    eligibleBranches: [],
    minCGPA: 0,
    minYear: 1,
    maxYear: 4,
    maxBacklogs: 0,
    slots: "",
    registrationDeadline: "",
    applicationLink: "",
    brochureUrl: "",
  })

  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: "" }))
    setSubmitError("")
  }

  const toggleBranch = (branch) => {
    setForm(prev => ({
      ...prev,
      eligibleBranches: prev.eligibleBranches.includes(branch)
        ? prev.eligibleBranches.filter(b => b !== branch)
        : [...prev.eligibleBranches, branch]
    }))
  }

  const validate = () => {
    const e = {}
    if (!form.companyName.trim()) e.companyName = "Company name is required"
    if (!form.role.trim()) e.role = "Role is required"
    if (!form.jobType) e.jobType = "Job type selection is required"
    if (!form.applicationLink.trim()) e.applicationLink = "Application link is required"
    
    if (!form.registrationDeadline) {
      e.registrationDeadline = "Registration deadline is required"
    } else if (new Date(form.registrationDeadline) < new Date()) {
      e.registrationDeadline = "Deadline must be in the future"
    }

    if (form.minCGPA < 0 || form.minCGPA > 10) e.minCGPA = "CGPA must be between 0 and 10"
    if (form.maxBacklogs < 0) e.maxBacklogs = "Cannot be negative"
    if (form.minYear < 1 || form.maxYear > 4 || form.minYear > form.maxYear) {
      e.yearConstraint = "Invalid year ranges selected"
    }

    if (form.applicationLink && !form.applicationLink.startsWith("http")) {
      e.applicationLink = "Must be a valid URL starting with http"
    }
    if (form.companyLogo && !form.companyLogo.startsWith("http")) {
      e.companyLogo = "Logo link must be a valid image link starting with http"
    }
    if (form.brochureUrl && !form.brochureUrl.startsWith("http")) {
      e.brochureUrl = "Brochure link must be a valid document link starting with http"
    }

    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setSubmitError("")
    try {
      await createDrive({
        companyName: form.companyName.trim(),
        companyLogo: form.companyLogo.trim() || undefined,
        role: form.role.trim(),
        description: form.description.trim() || undefined,
        jobType: form.jobType,
        driveType: form.driveType,
        location: form.location.trim() || undefined,
        ctc: form.jobType === "fulltime" ? form.ctc.trim() : undefined,
        stipend: form.jobType === "internship" ? form.stipend.trim() : undefined,
        bond: form.bond.trim() || undefined,
        batch: form.batch ? Number(form.batch) : undefined,
        eligibleBranches: form.eligibleBranches,
        minCGPA: Number(form.minCGPA),
        minYear: Number(form.minYear),
        maxYear: Number(form.maxYear),
        maxBacklogs: Number(form.maxBacklogs),
        slots: form.slots ? Number(form.slots) : null,
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
        applicationLink: form.applicationLink.trim(),
        brochureUrl: form.brochureUrl.trim() || undefined,
      })
      navigate("/career/drives", { state: { toast: "Drive created successfully." } })
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to create drive. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const minDeadline = new Date(Date.now() + 60000).toISOString().slice(0, 16)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Create Placement Drive</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Students will see this in the Career workspace.
        </p>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-4">
          <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* ── Company & Role ── */}
        <Section title="Company & Role">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Company Name</Label>
              <Input
                type="text"
                placeholder="e.g. Google, Microsoft"
                value={form.companyName}
                onChange={set("companyName")}
              />
              <FieldError message={errors.companyName} />
            </div>
            <div>
              <Label required>Role</Label>
              <Input
                type="text"
                placeholder="e.g. SDE Intern, SWE"
                value={form.role}
                onChange={set("role")}
              />
              <FieldError message={errors.role} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label optional>Company Logo URL</Label>
              <Input
                type="url"
                placeholder="https://logo.url/image.png"
                value={form.companyLogo}
                onChange={set("companyLogo")}
              />
              <FieldError message={errors.companyLogo} />
            </div>
            <div>
              <Label optional>Job Location</Label>
              <Input
                type="text"
                placeholder="e.g. Bangalore, Remote"
                value={form.location}
                onChange={set("location")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Job Type</Label>
              <Select value={form.jobType} onChange={set("jobType")}>
                {JOB_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
              <FieldError message={errors.jobType} />
            </div>
            <div>
              <Label>Drive Type</Label>
              <Select value={form.driveType} onChange={set("driveType")}>
                {DRIVE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label optional>Description</Label>
            <Textarea
              rows={4}
              placeholder="Job description, responsibilities, or any additional information for students..."
              value={form.description}
              onChange={set("description")}
            />
          </div>
        </Section>

        {/* ── Compensation & Terms ── */}
        <Section title="Compensation & Terms">
          <div className="grid grid-cols-2 gap-4">
            {form.jobType === "fulltime" ? (
              <div>
                <Label optional>CTC</Label>
                <Input
                  type="text"
                  placeholder="e.g. 12 LPA, Not disclosed"
                  value={form.ctc}
                  onChange={set("ctc")}
                />
              </div>
            ) : (
              <div>
                <Label optional>Stipend</Label>
                <Input
                  type="text"
                  placeholder="e.g. 30,000/month"
                  value={form.stipend}
                  onChange={set("stipend")}
                />
              </div>
            )}
            <div>
              <Label optional>Service Bond</Label>
              <Input
                type="text"
                placeholder="e.g. 2 Years, No bond"
                value={form.bond}
                onChange={set("bond")}
              />
            </div>
          </div>
        </Section>

        {/* ── Eligibility ── */}
        <Section title="Eligibility Criteria" subtitle="Leave branches empty to open for all branches">
          <div>
            <Label>Eligible Branches</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {BRANCHES.map(b => (
                <TogglePill
                  key={b}
                  label={b}
                  selected={form.eligibleBranches.includes(b)}
                  onClick={() => toggleBranch(b)}
                />
              ))}
            </div>
            {form.eligibleBranches.length === 0 && (
              <p className="text-xs text-gray-400 mt-1.5">Open to all branches</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Minimum CGPA</Label>
              <Input
                type="number"
                min={0}
                max={10}
                step={0.1}
                placeholder="0"
                value={form.minCGPA}
                onChange={set("minCGPA")}
              />
              <FieldError message={errors.minCGPA} />
            </div>
            <div>
              <Label>Max Backlogs</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.maxBacklogs}
                onChange={set("maxBacklogs")}
              />
              <FieldError message={errors.maxBacklogs} />
            </div>
            <div>
              <Label optional>Target Batch (Year)</Label>
              <Input
                type="number"
                placeholder="e.g. 2026"
                value={form.batch}
                onChange={set("batch")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Minimum Academic Year</Label>
              <Select value={form.minYear} onChange={set("minYear")}>
                {[1, 2, 3, 4].map(yr => (
                  <option key={yr} value={yr}>Year {yr}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Maximum Academic Year</Label>
              <Select value={form.maxYear} onChange={set("maxYear")}>
                {[1, 2, 3, 4].map(yr => (
                  <option key={yr} value={yr}>Year {yr}</option>
                ))}
              </Select>
            </div>
          </div>
          <FieldError message={errors.yearConstraint} />
        </Section>

        {/* ── Application ── */}
        <Section title="Application Details">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label optional>Total Slots Available</Label>
              <Input
                type="number"
                placeholder="Uncapped slots"
                value={form.slots}
                onChange={set("slots")}
              />
            </div>
            <div>
              <Label optional>Brochure URL Link</Label>
              <Input
                type="url"
                placeholder="https://drive.link/brochure.pdf"
                value={form.brochureUrl}
                onChange={set("brochureUrl")}
              />
              <FieldError message={errors.brochureUrl} />
            </div>
          </div>

          <div>
            <Label required>Application Link</Label>
            <Input
              type="url"
              placeholder="https://careers.company.com/apply"
              value={form.applicationLink}
              onChange={set("applicationLink")}
            />
            <FieldError message={errors.applicationLink} />
          </div>

          <div>
            <Label required>Registration Deadline</Label>
            <Input
              type="datetime-local"
              min={minDeadline}
              value={form.registrationDeadline}
              onChange={set("registrationDeadline")}
            />
            <FieldError message={errors.registrationDeadline} />
          </div>
        </Section>

        {/* ── Preview ── */}
        {(form.companyName || form.role) && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-400 mb-3">Preview</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {form.companyLogo ? (
                  <img src={form.companyLogo} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs font-bold text-gray-500">
                    {form.companyName?.slice(0, 2).toUpperCase() || "CO"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {form.companyName || "Company Name"}
                </p>
                <p className="text-xs text-gray-500">{form.role || "Role"}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {(form.ctc || form.stipend) && (
                  <p className="text-xs font-semibold text-gray-700">
                    {form.jobType === "fulltime" ? form.ctc : form.stipend}
                  </p>
                )}
                {form.registrationDeadline && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Deadline: {new Date(form.registrationDeadline).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : "Create Drive"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateDrive;