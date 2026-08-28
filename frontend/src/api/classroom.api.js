import api from "./axios";

export const getClassroom = () => api.get("/classroom");
export const saveDeadline = (classroomId, deadlineId = "", data) =>
  api.post(`/classroom/${classroomId}/deadline/save/${deadlineId}`, data);
export const getDeadlines = (id) => api.get(`classroom/${id}/deadlines`);
export const deleteDeadline=(classroomId,deadlineId)=>api.delete(`classroom/${classroomId}/deadline/delete/${deadlineId}`);