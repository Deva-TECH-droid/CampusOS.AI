import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams ,Link} from "react-router-dom";
import { ArrowLeft, X, Plus, AlertTriangle ,ShieldAlert} from "lucide-react";
import api from "../../api/axios"; 
import ImageUploadZone from "../../components/forms/ImageUploadZone"; 
import { updateClub } from "../../api/club.api";

// ─── Constants ────────────────────────────────────────────────
const CATEGORIES = ["Technical", "Cultural", "Creative", "Business"];

const categoryColor = {
  Technical: "border-blue-200 bg-blue-50 text-blue-700",
  Cultural: "border-purple-200 bg-purple-50 text-purple-700",
  Creative: "border-orange-200 bg-orange-50 text-orange-700",
  Business: "border-green-200 bg-green-50 text-green-700",
};

// ─── Field Components ─────────────────────────────────────────
const Label = ({ children, required, optional }) => (
  <label className="block text-xs font-medium text-gray-700 mb-1.5">
    {children}
    {required && <span className="text-red-400 ml-0.5">*</span>}
    {optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
  </label>
);

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-400 mt-1.5">{message}</p> : null;

const Section = ({ title, subtitle, children }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4">
    <div className="pb-2 border-b border-gray-50">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);



// ─── Main Component ───────────────────────────────────────────
const EditClub = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clubId } = useParams();

  const existingClub = location.state?.club;
  const isAdmin = location.state?.isAdmin;
  console.log(isAdmin);

  const [form, setForm] = useState({
    clubName: existingClub?.clubName || "",
    description: existingClub?.description || "",
    category: existingClub?.category || "",
    logo: existingClub?.logo || "",
    banner: existingClub?.banner || "",
    isActive: existingClub?.isActive ?? false,
  });

  const [admins, setAdmins] = useState(existingClub?.clubAdmins || []);
  const [adminInput, setAdminInput] = useState("");

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!existingClub || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-4 border border-red-100">
          <ShieldAlert size={22} />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1.5">Access Denied</h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-6">
          You do not have the required administrative permissions to modify the configuration properties for this club workspace.
          If you believe this is an error, please verify your credentials with a platform superadmin.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={12} /> Go Back
          </button>
          <Link
            to="/"
            className="flex-1 px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.clubName.trim()) e.clubName = "Club name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.category) e.category = "Category is required";
    return e;
  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
     
      const payload = await updateClub(clubId, {
        clubName: form.clubName.trim(),
        description: form.description.trim(),
        category: form.category,
        logo: form.logo ? form.logo : null,
        banner: form.banner ? form.banner : null,
        isActive: form.isActive,
        adminIds: admins.map((a) => a._id),
      });
      
      console.log("Update acknowledgment data context response:", payload.data);
      
      navigate(`/community/clubs/${clubId}`, {
        state: { toast: "Club updated successfully." },
      });
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to update club. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!existingClub || !isAdmin) return null;

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
        <h2 className="text-lg font-semibold text-gray-900">Edit Club</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Changes will be visible to all followers and members.
        </p>
      </div>

      {submitError && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-4">
          <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* ── Basic Info ── */}
        <Section title="Basic Information">
          <div>
            <Label required>Club Name</Label>
            {/* ✅ Swapped out abstraction helper components to direct, responsive syntax setters */}
            <input
              type="text"
              placeholder="e.g. WebDev Club, IEEE Chapter"
              value={form.clubName}
              onChange={(e) => {
                setForm(prev => ({ ...prev, clubName: e.target.value }));
                setErrors(prev => ({ ...prev, clubName: "" }));
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300 transition-colors"
            />
            <FieldError message={errors.clubName} />
          </div>

          <div>
            <Label required>Description</Label>
            {/* ✅ Swapped out abstraction helper components to direct, responsive syntax setters */}
            <textarea
              rows={5}
              placeholder="What does your club do? What are your goals and activities?"
              value={form.description}
              onChange={(e) => {
                setForm(prev => ({ ...prev, description: e.target.value }));
                setErrors(prev => ({ ...prev, description: "" }));
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300 transition-colors resize-none"
            />
            <FieldError message={errors.description} />
          </div>

          <div>
            <Label required>Category</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, category: cat }));
                    setErrors((prev) => ({ ...prev, category: "" }));
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all duration-150
                    ${form.category === cat
                        ? categoryColor[cat]
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <FieldError message={errors.category} />
          </div>
        </Section>

        {/* ── Branding ── */}
        <Section title="Branding" subtitle="Upload club media assets cleanly into your system">
          <div>
            <ImageUploadZone
              label="Club Icon / Logo"
              value={form.logo}
              folder="club-logos"
              onChange={(uploadedUrl) => {
                setForm((prev) => ({ ...prev, logo: uploadedUrl }));
                setSubmitError("");
              }}
            />
          </div>

          <div>
            <ImageUploadZone
              label="Club Header Banner"
              value={form.banner}
              folder="clubs-banners"
              onChange={(uploadedUrl) => {
                setForm((prev) => ({ ...prev, banner: uploadedUrl }));
                setSubmitError("");
              }}
            />
          </div>
        </Section>

        {/* ── Status ── */}
        <Section title="Club Status">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-9 h-5 rounded-full transition-colors duration-200 ${form.isActive ? "bg-gray-900" : "bg-gray-200"}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.isActive ? "translate-x-4" : "translate-x-0"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{form.isActive ? "Active" : "Inactive"}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {form.isActive ? "Club is visible and active on the platform." : "Club is hidden. Only Super Admin can activate it."}
              </p>
            </div>
          </label>
        </Section>

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
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditClub;