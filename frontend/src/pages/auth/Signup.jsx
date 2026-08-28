import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupApi, getTeachersDirectoryApi } from "../../api/auth.api.js";
import { BRANCHES } from "../../constants/branches.js";

const YEARS = [1, 2, 3, 4];
const SECTIONS = ["A", "B"];

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  branch: "",
  year: "",
  section: "",
  rollNumber: "",
  cgpa: "",
  requestedTeacher: "", // "facultyId::subject"
};


const Field = ({ name, label, type = "text", placeholder, value, onChange, error, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
    {children || (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 text-sm border rounded-lg outline-none focus:ring-2 transition-all placeholder:text-gray-300 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-gray-200 focus:border-gray-900 focus:ring-gray-900/5"
        }`}
      />
    )}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const selectClass = (fieldError) =>
  `w-full px-3.5 py-2.5 text-sm border rounded-lg outline-none focus:ring-2 transition-all bg-white ${
    fieldError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-gray-200 focus:border-gray-900 focus:ring-gray-900/5"
  }`;

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    getTeachersDirectoryApi()
      .then(({ data }) => setTeachers(data?.data?.directory || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setError("");
  };

  const validate = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = "Required";
    if (!form.lastName.trim()) errors.lastName = "Required";
    if (!form.email.trim()) errors.email = "Required";
    if (!form.password) errors.password = "Required";
    if (form.password.length < 8) errors.password = "Minimum 8 characters";
    if (form.password !== form.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    if (!form.branch) errors.branch = "Required";
    if (!form.year) errors.year = "Required";
    if (!form.section) errors.section = "Required";
    if (!form.rollNumber.trim()) errors.rollNumber = "Required";
    if (form.cgpa && (isNaN(form.cgpa) || form.cgpa < 0 || form.cgpa > 10))
      errors.cgpa = "Enter a value between 0 and 10";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setError("");

    const { confirmPassword, requestedTeacher, ...payload } = form;
    if (!payload.cgpa) delete payload.cgpa;

    let requestedFacultyId, requestedSubject;
    if (requestedTeacher) {
      [requestedFacultyId, requestedSubject] = requestedTeacher.split("::");
    }

    try {
      await signupApi({
        ...payload,
        year: Number(payload.year),
        cgpa: payload.cgpa ? Number(payload.cgpa) : 0,
        requestedFacultyId,
        requestedSubject,
      });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[420px] shrink-0 bg-gray-950 flex-col justify-between p-14">
        <div>
          <span className="text-white text-xl font-semibold tracking-tight">EventSphere</span>
        </div>
        <div>
          <h1 className="text-white text-4xl font-light leading-tight mb-6">
            Join your<br />
            <span className="font-semibold">campus network.</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Create your account to access events, placements, academic resources, and everything in between.
          </p>
        </div>
        <p className="text-gray-600 text-xs">© {new Date().getFullYear()} EventSphere</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <span className="text-gray-900 text-xl font-semibold tracking-tight">EventSphere</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Create account</h2>
            <p className="text-sm text-gray-500">Fill in your details to get started.</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <Field
                name="firstName"
                label="First name"
                placeholder="Arjun"
                value={form.firstName}
                onChange={handleChange}
                error={fieldErrors.firstName}
              />
              <Field
                name="lastName"
                label="Last name"
                placeholder="Sharma"
                value={form.lastName}
                onChange={handleChange}
                error={fieldErrors.lastName}
              />
            </div>

            <Field
              name="email"
              label="Email address"
              type="email"
              placeholder="you@college.edu"
              value={form.email}
              onChange={handleChange}
              error={fieldErrors.email}
            />

            {/* Password row */}
            <div className="grid grid-cols-2 gap-4">
              <Field
                name="password"
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                error={fieldErrors.password}
              />
              <Field
                name="confirmPassword"
                label="Confirm password"
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={handleChange}
                error={fieldErrors.confirmPassword}
              />
            </div>

            {/* Academic details */}
            <div className="pt-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Academic Details
              </p>
              <div className="space-y-5">
                <Field
                  name="rollNumber"
                  label="Roll number"
                  placeholder="22CS001"
                  value={form.rollNumber}
                  onChange={handleChange}
                  error={fieldErrors.rollNumber}
                />

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Branch</label>
                  <select
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    className={selectClass(fieldErrors.branch)}
                  >
                    <option value="">Select branch</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {fieldErrors.branch && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.branch}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Year</label>
                    <select
                      name="year"
                      value={form.year}
                      onChange={handleChange}
                      className={selectClass(fieldErrors.year)}
                    >
                      <option value="">Year</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    {fieldErrors.year && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.year}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Section</label>
                    <select
                      name="section"
                      value={form.section}
                      onChange={handleChange}
                      className={selectClass(fieldErrors.section)}
                    >
                      <option value="">Sec.</option>
                      {SECTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {fieldErrors.section && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.section}</p>
                    )}
                  </div>

                  <Field
                    name="cgpa"
                    label="CGPA"
                    type="number"
                    placeholder="8.5"
                    value={form.cgpa}
                    onChange={handleChange}
                    error={fieldErrors.cgpa}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Teacher to request (optional)
                  </label>
                  <select
                    name="requestedTeacher"
                    value={form.requestedTeacher}
                    onChange={handleChange}
                    className={selectClass()}
                  >
                    <option value="">I'll ask a teacher to add me later</option>
                    {teachers.map((t) => (
                      <option
                        key={`${t.facultyId}::${t.subject}`}
                        value={`${t.facultyId}::${t.subject}`}
                      >
                        {t.facultyName} — {t.subject} ({t.className})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-gray-400">
                    Your account needs a teacher's approval before you can access classes,
                    attendance, or coursework — picking one here sends them your request directly.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 active:bg-gray-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-gray-900 font-medium hover:underline underline-offset-2">
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-xs text-gray-400 text-center">
            Registering as a teacher?{" "}
            <Link to="/signup-teacher" className="text-gray-600 font-medium hover:underline underline-offset-2">
              Use the teacher registration form
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}