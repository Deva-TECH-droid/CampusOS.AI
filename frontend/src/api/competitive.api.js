import api from "./axios.js";

export const listResources = (category) =>
  api.get("/competitive", { params: category ? { category } : {} });

export const submitResource = (payload) => api.post("/competitive", payload);

export const listPendingResources = () => api.get("/competitive/admin/pending");
export const verifyResource = (id) => api.patch(`/competitive/admin/${id}/verify`);
export const deleteResource = (id) => api.delete(`/competitive/admin/${id}`);