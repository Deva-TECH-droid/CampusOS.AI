import api from "./axios";

// ── Browse ──
export const listStories = (params = {}) => api.get("/alumni/stories", { params });
export const getStory = (id) => api.get(`/alumni/stories/${id}`);
export const toggleLike = (id) => api.patch(`/alumni/stories/${id}/like`);

// ── Alumni ──
export const createStory = (payload) => api.post("/alumni/stories", payload);
export const listMyStories = () => api.get("/alumni/stories/mine");
export const updateStory = (id, payload) => api.patch(`/alumni/stories/${id}`, payload);
export const deleteStory = (id) => api.delete(`/alumni/stories/${id}`);

// ── Admin ──
export const adminListAlumni = () => api.get("/alumni/admin/list");
export const adminPromoteToAlumni = (payload) => api.post("/alumni/admin/promote", payload);
