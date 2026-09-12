import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupApi, getTeachersDirectoryApi } from "../../api/auth.api.js";
import { BRANCHES } from "../../constants/branches.js";
import { DEPARTMENT_SUBJECTS } from "../../constants/departmentSubjects.js";
import { BookOpen, User, Clock, CheckSquare, Square, School } from "lucide-react";

const YEARS = [1, 2, 3, 4];
const SECTIONS = ["A", "B", "C", "D"];

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

  // Multi-subject & teacher selection state (Req 6)
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectTeacherMap, setSubjectTeacherMap] = useState({}); // { [subject]: { facultyId, subject, classroomId, className, facultyName, time } }

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

    // If department/branch changes, reset selected subjects
    if (name === "branch") {
      setSelectedSubjects([]);
      setSubjectTeacherMap({});
    }
  };

  const handleToggleSubject = (sub) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects((prev) => prev.filter((s) => s !== sub));
      setSubjectTeacherMap((prev) => {
        const next = { ...prev };
        delete next[sub];
        return next;
      });
    } else {
      setSelectedSubjects((prev) => [...prev, sub]);
      // Auto-select first available teacher if any matches
      const available = teachers.filter((t) =>
        t.subject?.toLowerCase() === sub.toLowerCase()
      );
      if (available.length > 0) {
        setSubjectTeacherMap((prev) => ({
          ...prev,
          [sub]: available[0],
        }));
      }
    }
  };

  const handleSelectTeacherForSubject = (sub, teacherObj) => {
    setSubjectTeacherMap((prev) => ({
      ...prev,
      [sub]: teacherObj,
    }));
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

    const { confirmPassword, ...payload } = form;
    if (!payload.cgpa) delete payload.cgpa;

    // Build selectedEnrollments array
    const selectedEnrollments = Object.values(subjectTeacherMap).map((t) => ({
      facultyId: t.facultyId,
      subject: t.subject,
      classroomId: t.classroomId,
    }));

    // Legacy fallback parameters for first selection
    const firstTeacher = selectedEnrollments[0];

    try {
      await signupApi({
        ...payload,
        year: Number(payload.year),
        cgpa: payload.cgpa ? Number(payload.cgpa) : 0,
        selectedEnrollments,
        requestedFacultyId: firstTeacher?.facultyId,
        requestedSubject: firstTeacher?.subject,
      });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const availableSubjectsForBranch = form.branch
    ? DEPARTMENT_SUBJECTS[form.branch] || [
        "Java",
        "Web Development",
        "Data Structures",
        "Database Management",
        "Operating Systems",
      ]
    : [];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel branding */}
      <div className="hidden lg:flex lg:w-[420px] shrink-0 bg-gray-950 flex-col justify-between p-14">
        <div>
          <span className="text-white text-xl font-semibold tracking-tight">CampusOS.AI</span>
        </div>
        <div>
          <h1 className="text-white text-4xl font-light leading-tight mb-6">
            Join your<br />
            <span className="font-semibold">smart campus network.</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Dynamic course enrollment, face recognition attendance, timetable scheduling, and campus assistance.
          </p>
        </div>
        <p className="text-xs text-gray-500">CampusOS Intelligent Management System</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-lg space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create Student Account</h2>
            <p className="text-xs text-gray-500 mt-1">
              Select your department and subjects to submit class enrollment requests to faculty
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <Field
                name="firstName"
                label="First name"
                placeholder="Raj"
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

            {/* Email */}
            <Field
              name="email"
              label="Campus Email"
              type="email"
              placeholder="raj@college.edu"
              value={form.email}
              onChange={handleChange}
              error={fieldErrors.email}
            />

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-3">
              <Field
                name="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                error={fieldErrors.password}
              />
              <Field
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                error={fieldErrors.confirmPassword}
              />
            </div>

            {/* Department (Branch) Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Department / Branch *
              </label>
              <select
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className={selectClass(fieldErrors.branch)}
              >
                <option value="">Select your department</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {fieldErrors.branch && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.branch}</p>
              )}
            </div>

            {/* Academic details */}
            <div className="grid grid-cols-4 gap-2.5">
              <Field
                name="rollNumber"
                label="Roll No."
                placeholder="CS-101"
                value={form.rollNumber}
                onChange={handleChange}
                error={fieldErrors.rollNumber}
              />

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
                {fieldErrors.year && <p className="mt-1 text-xs text-red-600">{fieldErrors.year}</p>}
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
                {fieldErrors.section && <p className="mt-1 text-xs text-red-600">{fieldErrors.section}</p>}
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

            {/* Dynamic Subjects Selection (Requirement 6) */}
            {form.branch && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-indigo-600" />
                    Available Subjects in {form.branch}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Select the subjects you want to enroll in this semester:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableSubjectsForBranch.map((sub) => {
                    const isChecked = selectedSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleToggleSubject(sub)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all text-xs font-medium ${
                          isChecked
                            ? "bg-white border-gray-900 text-gray-900 shadow-xs"
                            : "bg-white/60 border-gray-200 text-gray-600 hover:bg-white"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare size={16} className="text-gray-900 shrink-0" />
                        ) : (
                          <Square size={16} className="text-gray-400 shrink-0" />
                        )}
                        <span>{sub}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Teacher / Class Selection for each checked subject */}
                {selectedSubjects.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 space-y-3">
                    <p className="text-xs font-bold text-gray-800">
                      Select preferred Teacher & Class timing:
                    </p>

                    {selectedSubjects.map((sub) => {
                      const matchingTeachers = teachers.filter((t) =>
                        t.subject?.toLowerCase().includes(sub.toLowerCase())
                      );

                      return (
                        <div
                          key={sub}
                          className="bg-white border border-gray-200 rounded-xl p-3 space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                              {sub}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {matchingTeachers.length} class option(s)
                            </span>
                          </div>

                          {matchingTeachers.length === 0 ? (
                            <div className="text-[11px] text-gray-400 italic py-1">
                              Faculty assignment for this subject is being finalized by admin. Your request will be queued.
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {matchingTeachers.map((t, idx) => {
                                const isChosen =
                                  subjectTeacherMap[sub]?.facultyId === t.facultyId;
                                return (
                                  <label
                                    key={idx}
                                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                      isChosen
                                        ? "bg-indigo-50/70 border-indigo-300 text-indigo-950 font-semibold"
                                        : "border-gray-100 hover:bg-gray-50 text-gray-700"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`teacher_${sub}`}
                                        checked={isChosen}
                                        onChange={() => handleSelectTeacherForSubject(sub, t)}
                                        className="text-gray-900 focus:ring-gray-900"
                                      />
                                      <div>
                                        <p className="text-xs font-bold text-gray-900">
                                          {t.facultyName}
                                        </p>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                                          <span className="flex items-center gap-0.5">
                                            <School size={10} /> Class: {t.className}
                                          </span>
                                          <span className="flex items-center gap-0.5">
                                            <Clock size={10} /> {t.time}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gray-950 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              {loading ? "Submitting Application…" : "Register & Submit Class Requests"}
            </button>
          </form>

          <div className="text-center text-xs text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-gray-900 hover:underline">
              Sign in
            </Link>
            <span className="mx-2">·</span>
            <Link to="/signup-teacher" className="font-semibold text-gray-900 hover:underline">
              Register as Teacher
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}