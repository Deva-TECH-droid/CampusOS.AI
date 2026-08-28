import api from "./axios";

// ── Faculty ──
export const uploadNote = (payload) => api.post("/notes", payload);
export const deleteNote = (id) => api.delete(`/notes/${id}`);
export const listFacultyNotes = () => api.get("/notes/faculty");

// ── Student ──
export const listMyNotes = (subject) => api.get("/notes/my", { params: { subject } });
