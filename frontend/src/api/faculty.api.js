import api from "./axios";

export const getMyAssignments = () => api.get("/faculty/assignments");
export const getMyTimetable = () => api.get("/faculty/timetable");

export const getRoster = (classroomId, subject, date) =>
  api.get("/faculty/roster", { params: { classroomId, subject, date } });

export const markRosterAttendance = (payload) =>
  api.post("/faculty/attendance", payload);

export const exportRosterAttendanceUrl = (classroomId, subject, from, to) => {
  const params = new URLSearchParams({ classroomId, subject });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return `${api.defaults.baseURL}/faculty/attendance/export?${params.toString()}`;
};

// ── Teacher Face Attendance (Req 9) ──
export const markTeacherFaceAttendance = (descriptor) =>
  api.post("/faculty/attendance/mark-face", { descriptor });
export const getTeacherTodayStatus = () =>
  api.get("/faculty/attendance/today-status");
export const adminListFacultyAttendance = (date) =>
  api.get("/faculty/admin/faculty-attendance", { params: { date } });

// ── Student List Excel & Email (Req 12 & 13) ──
export const exportStudentListExcelUrl = (classroomId, subject) =>
  `${api.defaults.baseURL}/faculty/student-list/export?classroomId=${classroomId}&subject=${encodeURIComponent(subject)}`;

export const sendStudentListToAdmin = (classroomId, subject) =>
  api.post("/faculty/student-list/send-to-admin", { classroomId, subject });

// ── Student approval & lists (Req 7) ──
export const listPendingStudents = () => api.get("/faculty/pending-students");
export const listApprovedStudents = () => api.get("/faculty/approved-students");
export const listRejectedStudents = () => api.get("/faculty/rejected-students");
export const listEnrolledStudents = () => api.get("/faculty/enrolled-students");
export const approveStudent = (studentId) =>
  api.patch(`/faculty/pending-students/${studentId}/approve`);
export const rejectStudent = (studentId) =>
  api.patch(`/faculty/pending-students/${studentId}/reject`);

// ── Admin ──
export const adminListFaculty = () => api.get("/faculty/admin/list");
export const adminListClassrooms = () => api.get("/faculty/admin/classrooms");
export const adminCreateOrAssignFaculty = (payload) =>
  api.post("/faculty/admin/create", payload);

// ── Admin: teacher approval ──
export const adminListPendingFaculty = () => api.get("/faculty/admin/pending");
export const adminApproveFaculty = (id) => api.patch(`/faculty/admin/${id}/approve`);
export const adminRejectFaculty = (id) => api.patch(`/faculty/admin/${id}/reject`);
