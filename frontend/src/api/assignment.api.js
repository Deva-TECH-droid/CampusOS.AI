import api from "./axios";

// ── Faculty ──
export const createAssignment = (payload) => api.post("/assignments", payload);
export const updateAssignment = (id, payload) => api.patch(`/assignments/${id}`, payload);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);
export const listFacultyAssignments = () => api.get("/assignments/faculty");
export const getSubmissions = (id) => api.get(`/assignments/${id}/submissions`);
export const gradeSubmission = (submissionId, payload) =>
  api.patch(`/assignments/submissions/${submissionId}/grade`, payload);

// ── Student ──
export const listMyAssignments = () => api.get("/assignments/my");
export const submitAssignment = (id, payload) => api.post(`/assignments/${id}/submit`, payload);
