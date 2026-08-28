import api from "./axios.js";

// GET /api/notices?targetType=&targetId=&page=&limit=
// Used by every module that renders a notice feed
export const getNotices = (params) => api.get("/notices", { params });

export const getNoticeById  = (id)    => api.get(`/notices/${id}`);
export const createNotice   = (data)  => api.post("/notices", data);
export const deleteNotice   = (id)    => api.delete(`/notices/${id}`);
export const togglePinNotice = (id)   => api.patch(`/notices/${id}/pin`);
export const archiveNotice  = (id)    => api.patch(`/notices/${id}/archive`);