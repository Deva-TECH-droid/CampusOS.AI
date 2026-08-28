import api from './axios'

export const createEvent=(data)=>api.post("/events/create",data);
export const updateEvent=(eventId,data)=>api.put(`events/${eventId}/update`,data)
export const getAllEvents=()=>api.get("/events");
export const getEventById=(id)=>api.get(`/events/${id}`);
export const registerForEvent=(id)=>api.put(`/events/${id}/register`);
export const getUpcomingEvents=()=>api.get(`events/upcoming`);
export const getUserRegisteredEvents=()=>api.get("events/registered")
