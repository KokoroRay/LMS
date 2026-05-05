// src/services/studentService.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api/v1",
});

api.interceptors.request.use((cfg) => {
  const stored = localStorage.getItem("access_token") || "";
  if (stored) {
    const token = stored.startsWith("Bearer ") ? stored.slice(7) : stored;
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  // KHÔNG set Content-Type cho FormData
  if (cfg.data instanceof FormData) {
    if (cfg.headers && cfg.headers["Content-Type"]) {
      delete cfg.headers["Content-Type"];
    }
  } else {
    cfg.headers = { ...(cfg.headers || {}), "Content-Type": "application/json" };
  }
  return cfg;
});

const STUDENTS_URL = "/admin/students";

/* ---------------- Helpers ---------------- */
const toFormDataWithData = (obj) => {
  const fd = new FormData();
  fd.append("data", JSON.stringify(obj || {}));
  return fd;
};

const unwrapPage = (res) => {
  const root = res?.data?.data ?? res?.data;
  const content =
    root?.content ??
    root?.items ??
    root?.list ??
    root?.records ??
    (Array.isArray(root) ? root : []);
  const total =
    root?.totalElements ??
    root?.total ??
    root?.count ??
    (Array.isArray(content) ? content.length : 0);
  return { content: Array.isArray(content) ? content : [], total: Number(total) || 0 };
};

const normalizeStudentItem = (s) => {
  const user = s?.user || {};
  const id = s?.userId ?? s?.id ?? user?.userId ?? user?.id ?? null;

  const firstName = s?.firstName ?? user?.firstName ?? "";
  const lastName  = s?.lastName  ?? user?.lastName  ?? "";
  const fullName  =
    s?.fullName ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    s?.name ||
    user?.fullName ||
    "";

  return {
    userId: id,              
    id,                     
    studentCode: s?.studentCode ?? user?.studentCode ?? s?.code ?? "",
    fullName,
    email: s?.email ?? user?.email ?? "",
    className:
      s?.className ??
      s?.class?.name ??
      s?.classNameCurrent ??
      "",
  };
};

/* ---------------- APIs tổng quát ---------------- */
export const getStudents = (params = {}) => api.get(STUDENTS_URL, { params });
export const getStudentById = (id) => api.get(`${STUDENTS_URL}/${id}`);
export const createStudent = (payload) => api.post(STUDENTS_URL, toFormDataWithData(payload));
export const updateStudent = (id, payload) => api.put(`${STUDENTS_URL}/${id}`, toFormDataWithData(payload));
export const deleteStudent = (id, opts = {}) => api.delete(`${STUDENTS_URL}/${id}`, { params: opts });

export const importStudents = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/admin/students/import", fd);
};

export const checkEmailExists = (email) =>
  api.get(`${STUDENTS_URL}/email/exists`, { params: { email } });

export const checkStudentCodeExists = (studentCode) =>
  api.get(`${STUDENTS_URL}/student-code/exists`, { params: { studentCode } });

export const getStudentsForDashboard = () => getStudents({ page: 0, size: 10000 });

export const searchStudents = async ({
  page = 1,
  size = 10,
  keyword = "",
  excludeClassId, 
  onlyNoClass = false,
  excludeStudentsInOtherActiveClasses = false,
} = {}) => {
  const zeroBasedPage = page > 0 ? page - 1 : 0;

  const res = await api.get(STUDENTS_URL, {
    params: {
      page: zeroBasedPage,
      size,
      keyword: keyword?.trim() || undefined,
      excludeClassId,
      onlyNoClass,
      excludeStudentsInOtherActiveClasses: excludeStudentsInOtherActiveClasses || undefined,
    },
  });

  const { content, total } = unwrapPage(res);
  const items = content.map(normalizeStudentItem);
  return { items, total };
};

export default api;
