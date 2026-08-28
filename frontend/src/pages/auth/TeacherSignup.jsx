import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupTeacherApi } from "../../api/auth.api.js";
import { BRANCHES } from "../../constants/branches.js";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  department: "",
  employeeId: "",
  subjects: "",
};

const Field = ({ name, label, type = "text", placeholder, value, onChange, error }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
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
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export default function TeacherSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (!form.department) errors.department = "Required";
    if (!form.employeeId.trim()) errors.employeeId = "Required";
    if (!form.subjects.trim()) errors.subjects = "List at least one subject";
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
    try {
      await signupTeacherApi({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        department: form.department,
        employeeId: form.employeeId,
        subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
      });
      navigate("/login", { state: { registeredTeacher: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-[420px] shrink-0 bg-gray-950 flex-col justify-between p-14">
        <div>
          <span className="text-white text-xl font-semibold tracking-tight">CampusOS</span>
        </div>
        <div>
          <h1 className="text-white text-4xl font-light leading-tight mb-6">
            Teach on
            <br />
            <span className="font-semibold">your terms.</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Register as a teacher. An admin will review and approve your account before you get
            access to the Teacher Portal.
          </p>
        </div>
        <p className="text-gray-600 text-xs">© {new Date().getFullYear()} CampusOS</p>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="lg:hidden mb-10">
            <span className="text-gray-900 text-xl font-semibold tracking-tight">CampusOS</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Teacher registration</h2>
            <p className="text-sm text-gray-500">
              Your account will need admin approval before you can access the Teacher Portal.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field
                name="firstName"
                label="First name"
                placeholder="Ram"
                value={form.firstName}
                onChange={handleChange}
                error={fieldErrors.firstName}
              />
              <Field
                name="lastName"
                label="Last name"
                placeholder="Kumar"
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

            <div className="pt-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Teaching Details
              </p>
              <div className="space-y-5">
                <Field
                  name="employeeId"
                  label="Employee ID"
                  placeholder="TCH-001"
                  value={form.employeeId}
                  onChange={handleChange}
                  error={fieldErrors.employeeId}
                />

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Department</label>
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg outline-none focus:ring-2 transition-all bg-white ${
                      fieldErrors.department
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-gray-200 focus:border-gray-900 focus:ring-gray-900/5"
                    }`}
                  >
                    <option value="">Select department</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {fieldErrors.department && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.department}</p>
                  )}
                </div>

                <Field
                  name="subjects"
                  label="Subject(s) you teach"
                  placeholder="Python, Data Structures"
                  value={form.subjects}
                  onChange={handleChange}
                  error={fieldErrors.subjects}
                />
                <p className="-mt-3 text-xs text-gray-400">
                  Comma-separated. An admin will link these to actual classrooms after approving you.
                </p>
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
                  Submitting...
                </>
              ) : (
                "Register as teacher"
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
            Registering as a student?{" "}
            <Link to="/signup" className="text-gray-600 font-medium hover:underline underline-offset-2">
              Use the student registration form
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
