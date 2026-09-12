import api from "./axios";

export const sendChatMessage = (message) => api.post("/chatbot/message", { message });
export const getChatHistory = () => api.get("/chatbot/history");

export const submitFeedback = (payload) => api.post("/feedback", payload);
export const getAdminFeedbacks = () => api.get("/feedback/admin");
