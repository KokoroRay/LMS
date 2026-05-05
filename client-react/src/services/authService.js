import axios from "axios";
import { checkTokenValidity, clearExpiredToken } from "../utils/tokenUtils";

const DOMAIN = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
const CLEAN_DOMAIN = DOMAIN.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN;
const API_BASE_URL = `${CLEAN_DOMAIN}/api/v1`;

const readAuthToken = () => localStorage.getItem("access_token") || localStorage.getItem("token") || "";

console.log('🔌 AuthService Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((cfg) => {
  const stored = readAuthToken();

  if (stored) {
    const tokenCheck = checkTokenValidity();
    if (!tokenCheck.valid && tokenCheck.expired) {
      clearExpiredToken();
      return Promise.reject(new Error("Token expired"));
    }
    const token = stored.startsWith("Bearer ") ? stored.slice(7) : stored;
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }

  if (cfg.data instanceof FormData) {
    if (cfg.headers && cfg.headers["Content-Type"]) {
      delete cfg.headers["Content-Type"];
    }
  } else {
    cfg.headers = {
      ...(cfg.headers || {}),
      "Content-Type": "application/json",
    };
  }
  return cfg;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const currentPath = window.location.pathname;
      const errorUrl = error.config?.url || "";

      const isKnownBadEndpoint =
        errorUrl.includes("/exams/class/undefined") ||
        errorUrl.includes("/payments") ||
        errorUrl.includes("/invoices") ||
        errorUrl.includes("/coupons") ||
        errorUrl.includes("/announcements");

      if (isKnownBadEndpoint) {
        return Promise.reject(error);
      }

      localStorage.removeItem("access_token");
      localStorage.removeItem("needChangePassword");
    }
    return Promise.reject(error);
  }
);
export const loginStudent = (data) => api.post("/auth/login", data);

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });

export const resetPassword = ({ token, newPassword, confirmPassword }) =>
  api.post("/auth/reset-password", { token, newPassword, confirmPassword });

export const getCurrentUser = async () => {
  const res = await api.get("/auth/profile");
  const user = res.data.data;
  if (user?.profile) {
    user.studentCode = user.profile.studentCode;
    user.className = user.profile.className;
  }
  return res;
};

export const changePassword = (data) => {
  const formData = new FormData();
  formData.append("currentPassword", data.currentPassword);
  formData.append("newPassword", data.newPassword);
  formData.append("confirmPassword", data.confirmPassword);
  return api.put("/auth/change-password", formData);
};

export const updateProfile = ({ data, avatar }) => {
  const fd = new FormData();
  fd.append("data", JSON.stringify(data || {}));
  if (avatar) fd.append("avatar", avatar);
  return api.put("/auth/profile", fd);
};
export const fetchAllPostAPI = () => api.get("/posts");
export const fetchPostDetailAPI = async (slug) => {
  // Thử endpoint mặc định trước
  try {
    return await api.get(`/posts/slug/${slug}`);
  } catch (error) {
    // Nếu 404, thử lấy tất cả posts rồi filter
    if (error?.response?.status === 404) {
      const allPostsRes = await api.get("/posts");
      const allPosts = Array.isArray(allPostsRes?.data?.content)
        ? allPostsRes.data.content
        : Array.isArray(allPostsRes?.data)
        ? allPostsRes.data
        : [];
      const post = allPosts.find((p) => p.slug === slug);
      if (post) {
        return { data: post };
      }
      throw new Error("Post not found");
    }
    throw error;
  }
};

export const fetchAllClassAPI = () => api.get("/admin/classes");

export const deleteClassAPI = (id) => api.delete(`/admin/classes/${id}`);

export const createClassAPI = (data) => api.post("/admin/classes", data);

export const getClassesForInstructor = () => api.get("/admin/classes");

export const fetchAllCategoriesAPI = () => api.get("/categories");

export const fetchAllTeacherAPI = () => api.get("/teachers");

export const getAllInstructors = () => api.get("/teachers");

export const getInstructorById = (id) => api.get(`/teachers/${id}`);

export const createInstructor = (formData) => api.post("/teachers", formData);

export const updateInstructor = (id, formData) =>
  api.put(`/teachers/${id}`, formData);

export const deleteInstructor = (id) => api.delete(`/teachers/${id}`);

export default api;