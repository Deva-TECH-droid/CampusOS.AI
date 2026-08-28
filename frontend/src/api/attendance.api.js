import api from "./axios";

export const enrollFace = (descriptors) =>
  api.post("/attendance/enroll-face", { descriptors });

export const getFaceEnrollmentStatus = () =>
  api.get("/attendance/enroll-face/status");

export const resetFaceEnrollment = () => api.delete("/attendance/enroll-face");

export const getActivePeriod = () => api.get("/attendance/active-period");

export const markAttendance = (descriptor) =>
  api.post("/attendance/mark", { descriptor });

export const getMyAttendance = (params = {}) =>
  api.get("/attendance/my", { params });

export const getMyAttendanceStats = () => api.get("/attendance/my/stats");

// ── Kiosk mode ──
export const kioskRecognize = (descriptor) =>
  api.post("/attendance/kiosk/recognize", { descriptor });

// ── Admin ──
export const adminListStudents = (classroomId) =>
  api.get("/attendance/admin/students", { params: { classroomId } });

export const adminEnrollFace = (studentId, descriptors) =>
  api.post(`/attendance/admin/enroll-face/${studentId}`, { descriptors });

export const adminGetStats = (classroomId) =>
  api.get("/attendance/admin/stats", { params: { classroomId } });

export const adminGetLogs = (params = {}) =>
  api.get("/attendance/admin/logs", { params });

export const adminMarkManual = (payload) =>
  api.post("/attendance/admin/mark-manual", payload);
