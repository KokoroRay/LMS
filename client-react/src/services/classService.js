import api from "./authService";

const unwrapArr = (res) =>
  Array.isArray(res?.data?.data) ? res.data.data : [];

export const getMyClasses = async () => {
  const res = await api.get("/admin/classes");
  return unwrapArr(res);
};

export const fetchAllClassAPI = () => {
  const token = localStorage.getItem('access_token');
  console.log('🔥 fetchAllClassAPI called - Token:', token ? 'EXISTS' : 'MISSING');
  console.trace('🔥 Call stack trace:');
  
  if (!token) {
    console.error('🚫 BLOCKED fetchAllClassAPI - No token available');
    throw new Error('Authentication required - no token available');
  }
  
  return api.get("/admin/classes");
};

export const createClassAPI = (data) => {
  return api.post("/admin/classes", data);
};

export const deleteClassAPI = (id) => {
  return api.delete(`/admin/classes/${id}`);
};

export const updateClassAPI = (id, data) => {
  return api.put(`/admin/classes/${id}`, data);
};

export const getClassesForInstructor = () => {
  return api.get("/admin/classes");
};

export const enrollStudentInClass = (classId, studentId) => {
  return api.post(`/classes/${classId}/students`, null, {
    params: { studentId },
  });
};

export const getStudentsInClass = (classId) =>
  api.get(`/classes/${classId}/students`);

export const removeStudentFromClass = (classId, studentId) =>
  api.delete(`/classes/${classId}/students/${studentId}`);

export const getSubjectsForClass = async (classId) => {
  const res = await api.get(`/admin/classes/${classId}/subjects`);
  return res?.data?.data || [];
};

export const updateStudentProgress = (classId, studentId, progress, status) => {
  return api.patch(`/classes/${classId}/students/${studentId}`, null, {
    params: { progress, status },
  });
};

export const bulkAddStudentsToClassAPI = (classId, studentIds) => {
  return api.post(`/admin/classes/${classId}/enroll/bulk`, studentIds);
};

// Thêm teacher vào lớp (Backend tự động gửi thông báo)
export const addTeacherToClassAPI = (classId, courseId, teacherId) => {
  return api.post(`/admin/classes/${classId}/teachers`, {
    courseId,
    teacherId,
  });
};

// Xóa teacher khỏi lớp (Backend tự động gửi thông báo)
export const removeTeacherFromClassAPI = (classId, courseId) => {
  return api.delete(`/admin/classes/${classId}/teachers/${courseId}`);
};

