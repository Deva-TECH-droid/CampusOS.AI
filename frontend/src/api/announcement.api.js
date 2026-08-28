import api from "./axios";

export const createAnnouncement = (targetType, targetId, data) =>
  api.post(`/announcements/${targetType}/${targetId}`, data);
export const deleteAnnouncement = (id) =>
  api.delete(`/announcements/${id}`);
export const getAnnouncements = (targetType, targetId) =>
  api.get(`/announcements/${targetType}/${targetId}`);
export const getCommunityFeed = (offsets = {}) => {
  return api.get(`announcements/community`, {
    params: {
      eventOffset: offsets.eventOffset ?? 0,
      clubOffset: offsets.clubOffset ?? 0,
      generalOffset: offsets.generalOffset ?? 0,
    },
  });
};
export const getUserActivity = () => api.get("/announcements/user-activity");
