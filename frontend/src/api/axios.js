import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // sends HttpOnly cookies automatically in every request
});

// Routes that should never trigger a silent refresh attempt
const AUTH_ROUTES = ["/auth/refresh", "/auth/me", "/auth/login", "/auth/signup"];

// Response interceptor — on 401, attempt one silent token refresh then retry
api.interceptors.response.use(
  (response) => response, // ← success path: do nothing, just return
  async (error) => {   // ← failure path: runs on every error response
    const originalRequest = error.config;
     // error.config contains everything about the failed request
    // method, url, headers, data — everything needed to retry it

    const isAuthRoute = AUTH_ROUTES.some((route) => originalRequest.url.includes(route));

    if (error.response?.status === 401 // only care about auth failures
      && !originalRequest._retry // haven't retried yet (prevents loop)
      && !isAuthRoute // not an auth route itself
      ) {

      originalRequest._retry = true; 
      // ↑ stamps the request so if it fails again with 401
      //   the condition above fails and we don't retry infinitely
      
      try {
        await api.post("/auth/refresh");
        return api(originalRequest);
      } catch {
        // Refresh failed — just reject, let the caller handle it
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;