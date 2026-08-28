import api from "./axios";

export const getMyAssignments = () => api.get("/faculty/assignments");

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

// ── Student approval (by faculty) ──
export const listPendingStudents = () => api.get("/faculty/pending-students");
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
