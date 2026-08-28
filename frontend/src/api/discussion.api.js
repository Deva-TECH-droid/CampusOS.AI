import api from "./axios.js";

export const getDiscussions = (params) => api.get("/discussions", { params });
export const getDiscussionById = (id) => api.get(`/discussions/${id}`);
export const createDiscussion = (data) => api.post("/discussions", data);
export const deleteDiscussion = (id) => api.delete(`/discussions/${id}`);
export const upvoteDiscussion = (id) => api.post(`/discussions/${id}/upvote`);
export const bookmarkDiscussion = (id) =>
  api.post(`/discussions/${id}/bookmark`);

export const addComment = (id, data) =>
  api.post(`/discussions/${id}/comments`, data);
export const upvoteComment = (id, cid) =>
  api.post(`/discussions/${id}/comments/${cid}/upvote`);
export const acceptAnswer = (id, cid) =>
  api.post(`/discussions/${id}/comments/${cid}/accept`);
export const deleteComment = (id, cid) =>
  api.delete(`/discussions/${id}/comments/${cid}`);

export const addReply = (id, cid, data) =>
  api.post(`/discussions/${id}/comments/${cid}/replies`, data);
export const upvoteReply = (id, cid, rid) =>
  api.post(`/discussions/${id}/comments/${cid}/replies/${rid}/upvote`);
export const deleteReply = (id, cid, rid) =>
  api.delete(`/discussions/${id}/comments/${cid}/replies/${rid}`);
