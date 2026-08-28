import api from "./axios.js";

export const signupApi = (data) => api.post("/auth/signup", data);
export const signupTeacherApi = (data) => api.post("/auth/signup-teacher", data);
export const getTeachersDirectoryApi = () => api.get("/auth/teachers-directory");
export const loginApi = (data) => api.post("/auth/login", data);
export const logoutApi = () => api.post("/auth/logout");
export const getMeApi = () => api.get("/auth/me");
export const refreshTokenApi = () => api.post("/auth/refresh");
export const getProfile=()=>api.get("/auth/profile");
export const updateProfile=(data)=>api.patch("/auth/profile",data);