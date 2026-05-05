import axios from 'axios';

// 1. Lấy Domain và nối thêm /api/v1
const DOMAIN = import.meta.env.VITE_API_BASE || 'https://d1ybhieu7adt5b.cloudfront.net';
const CLEAN_DOMAIN = DOMAIN.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN;
const API_BASE_URL = `${CLEAN_DOMAIN}/api/v1`;

console.log('🔌 API Base URL:', API_BASE_URL);

// 2. Tạo Axios Instance với BaseURL chuẩn
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = bearerToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- CÁC API SERVICE (Không cần thêm /api/v1 nữa, baseURL đã lo) ---

export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) { }
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  verifyToken: async () => {
    const response = await apiClient.post('/auth/verify');
    return response.data;
  },
};

export const userAPI = {
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },
  updateProfile: async (userData) => {
    const response = await apiClient.put('/users/profile', userData);
    return response.data;
  },
  changePassword: async (passwordData) => {
    const response = await apiClient.post('/users/change-password', passwordData);
    return response.data;
  },
};

export const lessonAPI = {
  getLessons: async (courseId) => {
    const response = await apiClient.get(`/lessons/course/${courseId}`);
    return response.data;
  },
  getLesson: async (lessonId) => {
    const response = await apiClient.get(`/lessons/${lessonId}`);
    return response.data;
  },
  getVideoPlayback: async (lessonId) => {
    const response = await apiClient.post(`/video/lesson/${lessonId}/playback`);
    return response.data;
  },
};

export const healthAPI = {
  check: async () => {
    const response = await apiClient.get('/actuator/health');
    return response.data;
  },
};

export const makeRequest = async (method, url, data = null, config = {}) => {
  try {
    const response = await apiClient({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Export apiClient as default (used by existing code: import api from './api.js')
export default apiClient;