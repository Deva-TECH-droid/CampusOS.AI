import api from "./axios";

// ── Talks (Req 14) ──
export const listAlumniTalks = () => api.get("/alumni/talks");
export const createAlumniTalk = (payload) => api.post("/alumni/talks", payload);
export const deleteAlumniTalk = (id) => api.delete(`/alumni/talks/${id}`);

// ── Browse Stories ──
export const listStories = (params = {}) => api.get("/alumni/stories", { params });
export const getStory = (id) => api.get(`/alumni/stories/${id}`);
export const toggleLike = (id) => api.patch(`/alumni/stories/${id}/like`);

// ── Comments (Req 16) ──
export const addStoryComment = (id, content) =>
  api.post(`/alumni/stories/${id}/comments`, { content });
export const deleteStoryComment = (id, commentId) =>
  api.delete(`/alumni/stories/${id}/comments/${commentId}`);

// ── Alumni ──
export const createStory = (payload) => api.post("/alumni/stories", payload);
export const listMyStories = () => api.get("/alumni/stories/mine");
export const updateStory = (id, payload) => api.patch(`/alumni/stories/${id}`, payload);
export const deleteStory = (id) => api.delete(`/alumni/stories/${id}`);

// ── Admin ──
export const adminListAlumni = () => api.get("/alumni/admin/list");
export const adminPromoteToAlumni = (payload) => api.post("/alumni/admin/promote", payload);
