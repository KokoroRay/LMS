// Mock service for testing new video streaming response format
// This will be used when backend is not available or for testing

export const mockVideoResponses = {
  // Success responses
  success_hls: {
    lessonId: 21,
    streamingUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    cookieSetterUrl: "https://d1234567890.cloudfront.net/_auth/set-cookie.html?return=http://localhost:5174",
    expiresIn: "3600 seconds",
    videoType: "HLS",
    accessedBy: "user@example.com",
    accessTime: new Date().toISOString(),
    clientIp: "127.0.0.1"
  },
  
  success_mp4: {
    lessonId: 22,
    streamingUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    expiresIn: "3600 seconds",
    videoType: "MP4",
    accessedBy: "user@example.com",
    accessTime: new Date().toISOString(),
    clientIp: "127.0.0.1"
  },
  
  // Error responses
  error_jwt_failed: {
    lessonId: 23,
    error: "HLS generation failed: JWT signing failed",
    videoType: "ERROR",
    message: "Video streaming is temporarily unavailable",
    accessedBy: "user@example.com",
    accessTime: new Date().toISOString()
  },
  
  error_not_found: {
    lessonId: 24,
    error: "Video not found",
    videoType: "ERROR",
    message: "No video available for this lesson",
    accessedBy: "user@example.com",
    accessTime: new Date().toISOString()
  },
  
  error_permission: {
    lessonId: 25,
    error: "Access denied",
    videoType: "ERROR",
    message: "You do not have permission to access this video",
    accessedBy: "user@example.com",
    accessTime: new Date().toISOString()
  }
};

// Mock API functions
export const mockGetVideoStreamingUrl = async (lessonId) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Simulate different responses based on lesson ID
  switch (lessonId) {
    case 21:
      return mockVideoResponses.success_hls;
    case 22:
      return mockVideoResponses.success_mp4;
    case 23:
      throw new Error(mockVideoResponses.error_jwt_failed.message);
    case 24:
      throw new Error(mockVideoResponses.error_not_found.message);
    case 25:
      throw new Error(mockVideoResponses.error_permission.message);
    default:
      // Random success/error for unknown lesson IDs
      if (Math.random() > 0.7) {
        throw new Error("Random error for testing");
      }
      return {
        ...mockVideoResponses.success_mp4,
        lessonId: lessonId,
        streamingUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
      };
  }
};

export const mockRefreshVideoStreamingUrl = async (lessonId) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
  
  // Return refreshed response
  const response = await mockGetVideoStreamingUrl(lessonId);
  return {
    ...response,
    accessTime: new Date().toISOString(),
    message: "Video URL refreshed successfully"
  };
};

// Function to enable/disable mock mode
let useMockMode = false;

export const setMockMode = (enabled) => {
  useMockMode = enabled;
  console.log(`Mock mode ${enabled ? 'enabled' : 'disabled'}`);
};

export const isMockMode = () => useMockMode;

// Override original functions in development
if (process.env.NODE_ENV === 'development') {
  // Can be toggled via console: setMockMode(true)
  window.setMockMode = setMockMode;
  window.mockVideoResponses = mockVideoResponses;
}