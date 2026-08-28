import api from "./axios";

// ── Faculty ──
export const createExam = (payload) => api.post("/exams", payload);
export const updateExam = (id, payload) => api.patch(`/exams/${id}`, payload);
export const submitForApproval = (id) => api.patch(`/exams/${id}/submit-for-approval`);
export const listFacultyExams = () => api.get("/exams/faculty");
export const getExamSubmissions = (id) => api.get(`/exams/${id}/submissions`);
export const gradeSubmission = (submissionId, marks) =>
  api.patch(`/exams/submissions/${submissionId}/grade`, { marks });
export const publishResults = (id) => api.patch(`/exams/${id}/publish-results`);
export const getClassAnalytics = (id) => api.get(`/exams/${id}/analytics`);

// ── Admin: test approval ──
export const adminListPendingExams = () => api.get("/exams/admin/pending");
export const adminApproveExam = (id) => api.patch(`/exams/admin/${id}/approve`);
export const adminRejectExam = (id, reason) =>
  api.patch(`/exams/admin/${id}/reject`, { reason });

// ── Student ──
export const listMyExams = () => api.get("/exams/my");
export const startExam = (id) => api.post(`/exams/${id}/start`);
export const submitExam = (id, answers) => api.post(`/exams/${id}/submit`, { answers });
export const getMyAnalysis = (id) => api.get(`/exams/${id}/analysis`);
