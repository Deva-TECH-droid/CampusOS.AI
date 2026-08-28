import api from "./axios.js";

export const getAllClubs=()=>api.get("/clubs");
export const getClubDetails=(clubId)=>api.get(`/clubs/${clubId}`);
export const followClub=(clubId)=>api.put(`/clubs/${clubId}/follow`);
export const getPopularClubs=()=>api.get("/clubs/popular");
export const getUserFollowedClubs = () => api.get('/clubs/followed');
export const updateClub=(clubId,data)=> api.put(`clubs/${clubId}/update`,data);