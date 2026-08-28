import api from "./axios";

/**
 * Uploads a single file to Cloudinary via the backend's generic upload
 * route and returns the resulting secure URL.
 */
export const uploadFile = async (file, folder = "general") => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/v1/upload?folder=${folder}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
};
