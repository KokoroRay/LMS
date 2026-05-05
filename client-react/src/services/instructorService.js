//instructorService.js

import api from "./authService";

export const fetchAllTeacherAPI = () => api.get("/teachers");
export const getAllInstructors = () => api.get("/teachers");
export const fetchAllCourseAPI = () => api.get("/courses");
export const getInstructorById = (id) => api.get(`/teachers/${id}`);
export const createInstructor = (formData) => api.post("/teachers", formData);
export const updateInstructor = (id, formData) =>
  api.put(`/teachers/${id}`, formData);
export const deleteInstructor = (id) => api.delete(`/teachers/${id}`);
