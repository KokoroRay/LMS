// Token utility functions
export const checkTokenValidity = () => {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return { valid: false, reason: 'No token found' };
  }

  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    // Decode JWT payload
    const payload = JSON.parse(atob(cleanToken.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp;
    const timeLeft = exp - now;
    
    const tokenInfo = {
      subject: payload.sub,
      role: payload.role,
      issuedAt: new Date(payload.iat * 1000),
      expiresAt: new Date(exp * 1000),
      timeLeftSeconds: timeLeft,
      timeLeftMinutes: Math.floor(timeLeft / 60),
      timeLeftHours: Math.floor(timeLeft / 3600)
    };

    if (timeLeft <= 0) {
      return { 
        valid: false, 
        reason: 'Token expired', 
        tokenInfo,
        expired: true 
      };
    }

    // Warn if token expires within 1 hour
    if (timeLeft < 3600) {
      return { 
        valid: true, 
        warning: `Token expires in ${Math.floor(timeLeft / 60)} minutes`,
        tokenInfo,
        expiringSoon: true 
      };
    }

    return { valid: true, tokenInfo };

  } catch (error) {
    return { 
      valid: false, 
      reason: 'Invalid token format', 
      error: error.message 
    };
  }
};

export const clearExpiredToken = () => {
  const tokenCheck = checkTokenValidity();
  
  if (!tokenCheck.valid && tokenCheck.expired) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('needChangePassword');
    console.log('🗑️ Expired token cleared from localStorage');
    return true;
  }
  
  return false;
};

export const logTokenInfo = () => {
  const tokenCheck = checkTokenValidity();
  
  console.group('🔐 Token Information');
  
  if (!tokenCheck.valid) {
    console.error('❌ Token Status:', tokenCheck.reason);
    if (tokenCheck.tokenInfo) {
      console.log('📅 Expired at:', tokenCheck.tokenInfo.expiresAt.toLocaleString());
    }
  } else {
    console.log('✅ Token Status: Valid');
    if (tokenCheck.warning) {
      console.warn('⚠️ Warning:', tokenCheck.warning);
    }
  }
  
  if (tokenCheck.tokenInfo) {
    console.log('👤 User:', tokenCheck.tokenInfo.subject);
    console.log('🎭 Role:', tokenCheck.tokenInfo.role);
    console.log('📅 Issued:', tokenCheck.tokenInfo.issuedAt.toLocaleString());
    console.log('📅 Expires:', tokenCheck.tokenInfo.expiresAt.toLocaleString());
    
    if (tokenCheck.valid) {
      console.log('⏱️ Time left:', 
        `${tokenCheck.tokenInfo.timeLeftHours}h ${tokenCheck.tokenInfo.timeLeftMinutes % 60}m`
      );
    }
  }
  
  console.groupEnd();
  
  return tokenCheck;
};

// Auto-check token on page load
export const initTokenCheck = () => {
  const tokenCheck = checkTokenValidity();
  
  if (tokenCheck.expired) {
    clearExpiredToken();
    console.log('🔄 Redirecting to login due to expired token...');
    
    // Only redirect if not already on login page
    // if (!window.location.pathname.includes('/login')) {
    //   window.location.href = '/login';
    // }
  } else if (tokenCheck.expiringSoon) {
    console.warn('⚠️ Token expires soon:', tokenCheck.warning);
  }
  
  return tokenCheck;
};