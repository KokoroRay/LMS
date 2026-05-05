// 🔐 Auth Utils - Utility functions for authentication
export const authUtils = {
  // Decode JWT token to get user info
  decodeToken(token) {
    if (!token) return null;
    
    try {
      // JWT has 3 parts: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      // Decode payload (base64)
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      // Failed to decode token
      return null;
    }
  },

  // Get user ID from token
  getUserIdFromToken(token) {
    const payload = this.decodeToken(token);
    return payload?.userId || payload?.sub || payload?.id || null;
  },

  // Check if token is expired
  isTokenExpired(token) {
    const payload = this.decodeToken(token);
    if (!payload?.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  },

  // Get current user ID from various sources
  getCurrentUserId() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    
    // Check if token is expired
    if (this.isTokenExpired(token)) {
      // Token is expired
      return null;
    }
    
    // Try to get from token
    const userIdFromToken = this.getUserIdFromToken(token);
    if (userIdFromToken) return userIdFromToken;
    
    // Fallback for testing (remove in production)
    return 1;
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('access_token');
    return !!(token && !this.isTokenExpired(token));
  }
};

export default authUtils;