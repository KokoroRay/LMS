import api from "./authService";

const unwrap = (res) => res?.data?.data ?? res?.data ?? res;

const toArray = (res) => {
  const d = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.courses)) return d.courses;
  if (Array.isArray(d?.items)) return d.items;
  return [];
};

/**
 * @description Hàm chuẩn hóa dữ liệu thành FormData và xử lý cấu trúc Grading Policy
 * @param {object} data - Dữ liệu môn học từ form
 * @returns {FormData}
 */
const toCourseFormData = (data) => {
  if (typeof FormData !== "undefined" && data instanceof FormData) return data;

  const list = data?.thumbnail || data?.fileList || data?.files;
  const file =
    Array.isArray(list) && list[0]?.originFileObj
      ? list[0].originFileObj
      : data?.thumbnail instanceof File
      ? data.thumbnail
      : data?.file instanceof File
      ? data.file
      : null;

  const {
    title,
    slug,
    shortDescription,
    description,
    price,
    level,
    status,
    categoryId,
    createdById,
    teacherIds,
    // Destructuring các trường Grading Policy theo tên form (snake_case)
    assignments_weight,
    quizzes_weight,
    exams_weight,
    passing_score,
  } = data?.course || data || {};

  // 1. Tạo đối tượng Grading Policy (Sử dụng camelCase cho Backend DTO)
  const gradingPolicy = {
    assignmentsWeight: assignments_weight,
    quizzesWeight: quizzes_weight,
    examsWeight: exams_weight,
    passingScore: passing_score,
  };

  const payload = {
    title,
    slug,
    shortDescription,
    description,
    price: Number.isFinite(Number(price)) ? Number(price) : 0,
    level,
    status: (status || "DRAFT").toUpperCase(),
    categoryId,
    createdById: createdById ?? 1,
    teacherIds,
    gradingPolicy,
  };

  const fd = new FormData();
  fd.append("course", JSON.stringify(payload));
  if (file) fd.append("thumbnail", file);
  return fd;
};

export const listSubjects = async () => {
  const res = await api.get("/courses");
  return toArray(res);
};

export const getCoursesByCategoryId = async (categoryId) => {
  const res = await api.get(`/courses/category/${categoryId}`);
  return toArray(res);
};

export const createSubjectManagementAPI = async (data) => {
  const formData = toCourseFormData(data);
  const res = await api.post("/courses", formData);
  return unwrap(res);
};

export const deleteSubjectManagementAPI = async (course_id) => {
  const res = await api.delete(`/courses/${course_id}`);
  return unwrap(res);
};

export const updateSubjectManagementAPI = async (course_id, data) => {
  const formData = toCourseFormData(data);
  const res = await api.put(`/courses/${course_id}`, formData);
  return unwrap(res);
};

export const fetchAllSubjectAPI = async () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Authentication required - no token available");
  }

  const res = await api.get("/courses");
  return { data: toArray(res) };
};

export const fetchCourseDetailAPI = async (course_id) => {
  const res = await api.get(`/lessons/course/${course_id}/structure`);
  return unwrap(res);
};

export const fetchFailedStudentsForCourseAPI = async (courseId) => {
  const res = await api.get(`/courses/${courseId}/failed-students`);
  return unwrap(res);
};

export const getTeachers = async () => {
  const res = await api.get("/users/teachers");
  return toArray(res);
};

export const getInstructorsByCourseIdAPI = async (courseId) => {
  const res = await api.get(`/courses/${courseId}/instructors`);
  return res?.data || [];
};

export const getPublishedCourses = async (title) => {
  const res = await api.get("/courses/published", { params: { title } });
  return toArray(res);
};

export const getMyCourses = async () => {
  const res = await api.get("/courses/my-courses");
  return toArray(res);
};

export const getMyEnrolledCourses = async () => {
  const res = await api.get("/courses/student/my-courses");
  return toArray(res);
};


export const getCourseByIdAPI = async (courseId) => {
  const res = await api.get(`/courses/${courseId}`);
  return unwrap(res); // sẽ ra CourseDTO: { id, title, slug, ... }
};