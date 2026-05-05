import api from "./authService";

const normalizeList = (res) =>
  Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];

// --- Helper function to ensure Class ID is passed as a number ---
const toClassId = (id) => (typeof id === "number" ? id : parseInt(id, 10));

// --- API Functions ---

export const getTimetableByClass = async (classId) => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Authentication required - no token available");
  }
  // Sử dụng endpoint đã sửa trong controller: /timetables/class/{classId}
  const res = await api.get(`/timetables/class/${toClassId(classId)}`);
  return normalizeList(res);
};

export const createTimetable = async (classId, dto) => {
  // Controller Java dùng POST /timetables, và DTO đã chứa classId (dto.classId)
  // Tuy nhiên, nếu Backend muốn classId trong path, ta dùng endpoint class-specific:
  const res = await api.post(`/timetables`, dto);
  return res?.data?.data ?? res.data;
};

export const updateTimetable = async (classId, timetableId, dto) => {
  // Controller Java dùng PUT /timetables/{timetableId}
  const res = await api.put(`/timetables/${toClassId(timetableId)}`, dto);
  return res?.data?.data ?? res.data;
};

export const deleteTimetable = async (classId, timetableId) => {
  // Controller Java dùng DELETE /timetables/{id}
  const res = await api.delete(`/timetables/${toClassId(timetableId)}`);
  return res?.data?.data ?? true;
};

export const getAdminTimetableByClass = async (classId) => {
  // Endpoint cho Admin: /timetables/admin/class/{classId}/all
  const res = await api.get(
    `/timetables/admin/class/${toClassId(classId)}/all`
  );
  return normalizeList(res);
};

export const getInstructorTimetable = async () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Authentication required - no token available");
  }
  // Endpoint cho Giảng viên: /timetables/instructor/my-timetable
  const res = await api.get(`/timetables/instructor/my-timetable`);
  return normalizeList(res);
};

const fetchInstructorClassesBase = async () => {
  // Endpoint cho Lớp học của GV: /timetables/instructor/my-classes
  const res = await api.get(`/timetables/instructor/my-classes`);
  return normalizeList(res);
};

export const fetchInstructorClasses = fetchInstructorClassesBase;
export const fetchInstructorClassesAPI = fetchInstructorClassesBase;

export const getStudentTimetableWithAttendance = async (studentId) => {
  // Giả định studentId là tham số truyền vào
  const endpoint = studentId
    ? `/timetables/student/${toClassId(studentId)}`
    : `/timetables/student/me`;
  const res = await api.get(endpoint);
  return normalizeList(res);
};

export const getInstructorCoursesByClass = async (classId) => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Authentication required - no token available");
  }
  // Endpoint lấy Courses theo Class cho GV: /timetables/instructor/class/{classId}/courses
  const res = await api.get(
    `/timetables/instructor/class/${toClassId(classId)}/courses`
  );
  return normalizeList(res);
};
