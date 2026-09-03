import api from "./axios";

export const getClassroom = () => api.get("/classroom");
export const saveDeadline = (classroomId, deadlineId = "", data) =>
  api.post(`/classroom/${classroomId}/deadline/save/${deadlineId}`, data);
export const getDeadlines = (id) => api.get(`classroom/${id}/deadlines`);
export const deleteDeadline=(classroomId,deadlineId)=>api.delete(`classroom/${classroomId}/deadline/delete/${deadlineId}`);

// ── Admin: manage classrooms ──
export const adminListAllClassrooms = () => api.get("/classroom/admin/all");
export const adminCreateClassroom = (payload) => api.post("/classroom/admin/create", payload);
export const adminDeleteClassroom = (id) => api.delete(`/classroom/admin/${id}`);
export const adminAddPeriod = (classroomId, payload) =>
  api.post(`/classroom/admin/${classroomId}/periods`, payload);
export const adminRemovePeriod = (classroomId, day, index) =>
  api.delete(`/classroom/admin/${classroomId}/periods/${day}/${index}`);