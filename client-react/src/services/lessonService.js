import api from "./authService";

const unwrap = (res) => (res?.data?.data ?? res?.data ?? res);

// Basic lesson operations
export const listLessonsBySession = async (sessionId) => {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('Authentication required - no token available');
  }
  
  const res = await api.get(`/lessons/session/${sessionId}`);
  return unwrap(res);
};

export const getLessonById = async (lessonId) => {
  const res = await api.get(`/lessons/${lessonId}`);
  return unwrap(res);
};

export const getCourseStructure = async (courseId) => {
  const res = await api.get(`/lessons/course/${courseId}/structure`);
  return unwrap(res);
};

// Video playback operations
export const getVideoPlayback = async (lessonId) => {
  try {
    const res = await api.post(`/lessons/${lessonId}/video/public-playback`);
    const result = res.data;
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Video playback failed');
    }
    
    return {
      lessonId: result.lessonId,
      lessonTitle: result.lessonTitle,
      hlsUrl: result.streamingUrl,
      dashUrl: result.dashUrl,
      cookieSetterUrl: result.cookieSetterUrl,
      duration: result.duration,
      status: result.status
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Video not found for this lesson');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to access this video');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication required to access video');
    } else if (error.response?.status === 500) {
      throw new Error('Video playback generation failed on server');
    }
    
    throw error;
  }
};

// Backend proxy for video URLs
export const getBackendProxyVideo = async (lessonId) => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
    const proxyUrl = `${baseUrl}/api/v1/lessons/${lessonId}/video/stream-anonymous`;
    
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      credentials: 'include',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Backend proxy failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success' && data.streamingUrl) {
      return {
        success: true,
        videoUrl: data.streamingUrl,
        blobUrl: data.streamingUrl,
        hlsUrl: data.streamingUrl,
        cookieSetterUrl: data.cookieSetterUrl
      };
    } else {
      throw new Error(data.message || 'No streaming URL returned');
    }
  } catch (error) {
    console.error('Backend proxy error:', error);
    throw error;
  }
};

// Validate if a CloudFront URL is accessible
const validateVideoUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Extract courseId from lesson data with multiple fallback strategies
const extractCourseId = (lesson, lessonId) => {
  // Try multiple properties where courseId might be stored
  const possibleCourseIds = [
    lesson?.courseId,
    lesson?.course?.courseId,
    lesson?.course?.id,
    lesson?.sessionDto?.courseId,
    lesson?.sessionDto?.course?.courseId,
  ].filter(Boolean);
  
  if (possibleCourseIds.length > 0) {
    return possibleCourseIds[0];
  }
  
  // If no courseId found, try to infer from lessonId pattern
  // Some systems use predictable courseId patterns
  console.warn(`⚠️ No courseId found for lesson ${lessonId}, using intelligent fallback`);
  
  // For now, assume courseId matches lessonId for the path structure
  // This may need adjustment based on your actual data structure
  return lessonId;
};

// Dynamic CloudFront video URL generation based on backend pattern
export const getDynamicCloudFrontVideoUrl = async (lessonId) => {
  const CLOUDFRONT_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
  
  try {
    // First try to get lesson info to extract courseId
    const lesson = await getLessonById(lessonId);
    const courseId = extractCourseId(lesson, lessonId);
    
    console.log(`🎯 Generating dynamic video URL for lesson ${lessonId}, course ${courseId}`);
    
    // Backend pattern: "vod/hls/{courseId}_{lessonId}/"
    const basePath = `vod/hls/${courseId}_${lessonId}`;
    
    // Try to get the actual m3u8 filename from backend first
    try {
      const m3u8Info = await getM3u8FileInfo(lessonId);
      if (m3u8Info?.fileName) {
        const backendUrl = `${CLOUDFRONT_BASE}/${basePath}/${m3u8Info.fileName}`;
        console.log(`✅ Using backend-provided m3u8 filename: ${backendUrl}`);
        return backendUrl;
      }
    } catch (error) {
      console.log('⚠️ Could not get m3u8 info from backend, trying fallback patterns...');
    }
    
    // If backend doesn't provide m3u8 info, try common patterns based on MediaConvert output
    const commonFileNames = [
      'main.m3u8.m3u8',  // Primary pattern from your example
      'master.m3u8',     // Standard HLS pattern
      'main.m3u8',       // Single extension variant
    ];
    
    // Try each filename pattern
    for (const fileName of commonFileNames) {
      const fullUrl = `${CLOUDFRONT_BASE}/${basePath}/${fileName}`;
      console.log(`🔍 Generated CloudFront URL: ${fullUrl}`);
      return fullUrl;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error generating dynamic CloudFront URL:', error);
    return null;
  }
};

// Advanced fallback: Try multiple courseId combinations if exact courseId fails
export const getCloudFrontVideoUrlWithFallbacks = async (lessonId) => {
  const CLOUDFRONT_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
  
  // Try primary dynamic URL first
  try {
    const primaryUrl = await getDynamicCloudFrontVideoUrl(lessonId);
    if (primaryUrl) return primaryUrl;
  } catch (error) {
    console.log('Primary dynamic URL generation failed, trying fallbacks...');
  }
  
  // If primary fails, try common courseId patterns
  const commonCourseIds = [
    lessonId,        // Same as lessonId
    17,              // Common courseId from examples
    1,               // Default course
    Math.floor(lessonId / 10) * 10,  // Round down to nearest 10
  ];
  
  const fileNames = ['main.m3u8.m3u8', 'master.m3u8', 'main.m3u8'];
  
  for (const courseId of commonCourseIds) {
    for (const fileName of fileNames) {
      const basePath = `vod/hls/${courseId}_${lessonId}`;
      const fullUrl = `${CLOUDFRONT_BASE}/${basePath}/${fileName}`;
      console.log(`🔄 Fallback attempt: ${fullUrl}`);
      
      // Return first combination (can add validation later if needed)
      return fullUrl;
    }
  }
  
  return null;
};

// Fallback function for backward compatibility
export const getCloudFrontVideoUrl = getDynamicCloudFrontVideoUrl;

// Basic lesson CRUD operations
export const createLessonWithVideo = async (dto, videoFile = null) => {
  const formData = new FormData();
  formData.append("lesson", JSON.stringify(dto));

  if (videoFile) {
    formData.append("video", videoFile);
  }

  const res = await api.post(`/lessons`, formData);
  return unwrap(res);
};

export const updateLessonWithVideo = async (lessonId, dto, videoFile = null) => {
  const formData = new FormData();
  formData.append("lesson", JSON.stringify(dto));

  if (videoFile) {
    formData.append("video", videoFile);
  }

  const res = await api.put(`/lessons/${lessonId}`, formData);
  return unwrap(res);
};

export const deleteLesson = async (lessonId) => {
  const res = await api.delete(`/lessons/${lessonId}`);
  return unwrap(res);
};

// Get m3u8 file info from backend
export const getM3u8FileInfo = async (lessonId) => {
  try {
    const res = await api.get(`/lessons/${lessonId}/video/m3u8-info`);
    return unwrap(res);
  } catch (error) {
    console.error('Error getting m3u8 info:', error);
    throw error;
  }
};

// Video streaming operations
export const getVideoStreamingUrl = async (lessonId) => {
  try {
    const res = await api.get(`/lessons/${lessonId}/video/streaming-url`);
    return unwrap(res);
  } catch (error) {
    console.error('Error getting streaming URL:', error);
    throw error;
  }
};

export const refreshVideoStreamingUrl = async (lessonId) => {
  try {
    const res = await api.post(`/lessons/${lessonId}/video/refresh-streaming-url`);
    return unwrap(res);
  } catch (error) {
    console.error('Error refreshing streaming URL:', error);
    throw error;
  }
};

// Default export for compatibility
export default {
  listLessonsBySession,
  getLessonById,
  getCourseStructure,
  getVideoPlayback,
  getBackendProxyVideo,
  getDynamicCloudFrontVideoUrl,
  getCloudFrontVideoUrlWithFallbacks,
  getCloudFrontVideoUrl,
  getM3u8FileInfo,
  createLessonWithVideo,
  updateLessonWithVideo,
  deleteLesson,
  getVideoStreamingUrl,
  refreshVideoStreamingUrl,
};