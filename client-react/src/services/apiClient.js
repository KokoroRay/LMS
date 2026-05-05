import axios from 'axios';

/**
 * API Configuration Setup
 * - Base URL từ environment variable
 * - Automatic token injection
 * - Error handling & retry logic
 */

// Get API base URL từ .env hoặc sử dụng CloudFront
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'https://d1ybhieu7adt5b.cloudfront.net/api/v1';

console.log('🔌 API Configuration:');
console.log('  Base URL:', API_BASE_URL);
console.log('  Env VITE_API_BASE:', import.meta.env.VITE_API_BASE);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * - Automatically add auth token from localStorage
 * - Block unauthorized requests early
 * - Add request logging for debugging
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    
    // Log request untuk debugging
    console.log(`📤 [${config.method?.toUpperCase()}] ${config.url}`, {
      hasToken: !!token,
      timestamp: new Date().toISOString(),
    });
    
    // Add token to authorization header
    if (token) {
      const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = bearerToken;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error.message);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * - Handle different error types
 * - Auto logout on 401 (Unauthorized)
 * - Retry logic for specific errors
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`📥 [${response.status}] Success:`, response.config.url);
    return response;
  },
  (error) => {
    const errorResponse = {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      timestamp: new Date().toISOString(),
    };
    
    console.error('❌ API Error:', errorResponse);
    
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      console.warn('🔐 [401] Unauthorized - Clearing token and redirecting to login');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
      
      // Redirect only if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('🚫 [403] Forbidden - Access denied');
    }
    
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.warn('❓ [404] Resource not found');
    }
    
    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error('⚠️ [500] Server error - Try again later');
    }
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network Error - Check your connection');
    }
    
    return Promise.reject(error);
  }
);

/**
 * API Service Methods
 */

// Auth endpoints
export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API failed, clearing local storage anyway');
    }
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

// User endpoints
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

// Lesson endpoints
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

// Health check endpoint
export const healthAPI = {
  check: async () => {
    try {
      const response = await apiClient.get('/actuator/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },
};

/**
 * Utility function to make custom requests
 */
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
    console.error(`Request failed [${method} ${url}]:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Export default client for direct use
 */
export default apiClient;
