import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Space, Tag, Alert, Steps, Spin, Modal } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, KeyOutlined, LinkOutlined, ApiOutlined } from '@ant-design/icons';

const VideoPlayerWithAuth = ({ lesson }) => {
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const [error, setError] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  const [jwtToken, setJwtToken] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const fetchVideoFromBackend = async () => {
    if (!lesson?.lessonId) return;
    
    setLoading(true);
    setError('');
    setAuthStep(1);
    setApiResponse(null);
    
    try {
      console.log('🔗 Fetching video info from backend API for lesson:', lesson.lessonId);
      
      // Call backend public API
      const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/v1/lessons/${lesson.lessonId}/video/public-playback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Backend API response:', data);
      
      setApiResponse(data);
      setAuthStep(2);

      if (data.status === 'success' && data.streamingUrl) {
        setVideoInfo({
          hlsUrl: data.streamingUrl,
          dashUrl: data.dashUrl,
          cookieSetterUrl: data.cookieSetterUrl,
          duration: data.duration,
          lessonTitle: data.lessonTitle
        });

        // Extract JWT token from cookie setter URL
        if (data.videoUrls.cookieSetter && data.videoUrls.cookieSetter.includes('#')) {
          const token = data.videoUrls.cookieSetter.split('#')[1];
          setJwtToken(token);
          console.log('🔐 Extracted JWT token from cookie setter URL');
          
          // Automatically try to set CloudFront cookie
          await setCloudFrontCookie(token);
        }

        console.log('🎵 Loading HLS video from backend URL:', data.videoUrls.hls);
        
        // Initialize HLS player with backend URL
        await initializeHLS(data.videoUrls.hls);
        
        setAuthStep(3);
      } else {
        throw new Error(data.message || 'Backend did not return video URLs');
      }

      setLoading(false);
      
    } catch (err) {
      console.error('❌ Backend API failed:', err);
      setError(`Backend API failed: ${err.message}`);
      setLoading(false);
      setAuthStep(4);
    }
  };

  const setCloudFrontCookie = async (token) => {
    try {
      console.log('🍪 Attempting to set CloudFront cookie with JWT token');
      
      // Method 1: Try setting cookie via document.cookie (limited by CORS)
      const cookieString = `CloudFront-Policy=${token}; Path=/; Secure; SameSite=None; Max-Age=3600`;
      document.cookie = cookieString;
      
      // Method 2: Use fetch with credentials to CloudFront domain to establish session
      try {
        await fetch('https://d1ybhieu7adt5b.cloudfront.net/', {
          method: 'HEAD',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Origin': 'http://localhost:5174'
          }
        });
        console.log('✅ CloudFront session request completed');
      } catch (fetchError) {
        console.log('⚠️ CloudFront direct session failed (expected for CORS):', fetchError.message);
      }
      
      // Method 3: Show modal for manual authentication
      setShowAuthModal(true);
      
    } catch (error) {
      console.error('❌ CloudFront cookie setup failed:', error);
    }
  };

  const authenticateWithCloudFront = () => {
    if (!jwtToken) {
      setError('No JWT token available for authentication');
      return;
    }

    console.log('🔐 Opening CloudFront authentication window');
    
    // Create a data URL with the cookie setter logic
    const cookieSetterScript = `
      <!DOCTYPE html>
      <html>
      <head><title>CloudFront Auth</title></head>
      <body>
        <h3>🔐 Setting CloudFront Authentication...</h3>
        <p id="status">Initializing...</p>
        <script>
          try {
            // Set the JWT cookie for CloudFront domain
            document.cookie = "CloudFront-Policy=${jwtToken}; Path=/; Secure; SameSite=None; Max-Age=3600; Domain=.cloudfront.net";
            document.cookie = "AuthToken=${jwtToken}; Path=/; Secure; SameSite=None; Max-Age=3600";
            
            document.getElementById('status').innerHTML = '✅ Cookie set! You can close this window and try playing the video.';
            
            // Notify parent window
            if (window.opener) {
              window.opener.postMessage('auth-complete', '*');
            }
            
            // Auto close after 3 seconds
            setTimeout(() => {
              if (window.opener) {
                window.close();
              }
            }, 3000);
            
          } catch (error) {
            document.getElementById('status').innerHTML = '❌ Error: ' + error.message;
          }
        </script>
      </body>
      </html>
    `;

    // Create blob URL and open in new window
    const blob = new Blob([cookieSetterScript], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const authWindow = window.open(blobUrl, 'cloudfront-auth', 'width=500,height=400');
    
    // Listen for auth completion message
    const messageHandler = (event) => {
      if (event.data === 'auth-complete') {
        console.log('✅ Authentication completed');
        setShowAuthModal(false);
        setError('');
        
        // Retry video loading
        if (videoInfo?.hlsUrl) {
          initializeHLS(videoInfo.hlsUrl);
        }
        
        window.removeEventListener('message', messageHandler);
        URL.revokeObjectURL(blobUrl);
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    // Clean up if window is closed manually
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        URL.revokeObjectURL(blobUrl);
      }
    }, 1000);
  };

  const initializeHLS = async (videoUrl) => {
    const video = videoRef.current;
    if (!video) return;

    // Clean up existing HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    console.log('🎵 Initializing HLS for authenticated CloudFront access...');

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        debug: true,
        enableWorker: true,
        lowLatencyMode: false,
        xhrSetup: function(xhr, url) {
          console.log('🌐 HLS XHR Setup for:', url);
          
          // Configure for CloudFront with JWT authentication
          xhr.withCredentials = true; // Include cookies
          
          // Set headers for CloudFront access
          xhr.setRequestHeader('Origin', 'http://localhost:5174');
          xhr.setRequestHeader('Referer', 'http://localhost:5174/');
          
          // Add JWT token in Authorization header
          if (jwtToken) {
            xhr.setRequestHeader('Authorization', `Bearer ${jwtToken}`);
            console.log('🔐 Added JWT token to Authorization header');
          }
          
          // Add custom CloudFront headers
          xhr.setRequestHeader('CloudFront-Viewer-Country', 'VN');
          xhr.setRequestHeader('X-Forwarded-Proto', 'https');
        }
      });

      hlsRef.current = hls;

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ CloudFront HLS manifest loaded successfully');
        setError('');
        setAuthStep(3);
        video.play().catch(e => {
          console.log('Auto-play prevented:', e);
        });
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS Error:', data);
        
        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              console.log('🔄 Network error - authentication may be required');
              setError('CloudFront access denied. Click "Authenticate" to set JWT cookie.');
              setAuthStep(4);
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 Media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.log('🔄 Fatal error:', data);
              setError(`HLS error: ${data.details}`);
              setAuthStep(4);
              break;
          }
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      console.log('🍎 Using Safari native HLS');
      video.src = videoUrl;
      video.load();
    } else {
      // Last resort - direct loading
      console.log('📺 Using direct video loading');
      video.src = videoUrl;
      video.load();
    }
  };

  useEffect(() => {
    if (lesson) {
      fetchVideoFromBackend();
    }
  }, [lesson]);

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  const steps = [
    { title: 'Start', description: 'Calling backend API' },
    { title: 'API', description: 'Getting JWT token' },
    { title: 'Auth', description: 'CloudFront authentication' },
    { title: 'Play', description: 'Video ready to play' },
    { title: 'Error', description: 'Authentication required' }
  ];

  return (
    <>
      <Card 
        title={`🔐 Authenticated Video Player - ${videoInfo?.lessonTitle || lesson?.lessonName || `Lesson ${lesson?.lessonId}`}`}
        extra={
          <Space>
            <Tag color="purple">JWT Auth</Tag>
            {jwtToken && <Tag color="green">Token Ready</Tag>}
            <Button 
              onClick={fetchVideoFromBackend} 
              loading={loading}
              icon={<ReloadOutlined />}
              size="small"
            >
              Retry
            </Button>
            <Button 
              onClick={authenticateWithCloudFront}
              icon={<KeyOutlined />}
              size="small"
              type="primary"
              disabled={!jwtToken}
            >
              Authenticate
            </Button>
          </Space>
        }
      >
        
        {/* Progress Steps */}
        <div style={{ marginBottom: 16 }}>
          <Steps 
            current={authStep} 
            size="small"
            items={steps}
            status={error ? 'error' : 'process'}
          />
        </div>

        {error && (
          <Alert
            message="CloudFront Authentication Required"
            description={error}
            type="error"
            style={{ marginBottom: 16 }}
            action={
              <Space>
                <Button size="small" onClick={authenticateWithCloudFront} icon={<KeyOutlined />}>
                  Authenticate
                </Button>
              </Space>
            }
          />
        )}

        {/* Loading Spinner */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Spin size="large" />
            <div style={{ marginTop: 10 }}>Fetching authenticated video...</div>
          </div>
        )}

        <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' }}>
          
          {/* Video Element */}
          <video
            ref={videoRef}
            controls
            autoPlay={false}
            preload="metadata"
            style={{
              width: '100%',
              height: '400px',
              backgroundColor: '#000'
            }}
            onLoadStart={() => {
              console.log('📺 Authenticated video load started');
            }}
            onLoadedData={() => {
              console.log('✅ Authenticated video data loaded');
              setError('');
              setAuthStep(3);
            }}
            onCanPlay={() => {
              console.log('▶️ Authenticated video ready to play');
              setAuthStep(3);
            }}
            onError={(e) => {
              console.error('❌ Authenticated video error:', e);
              setError('Video load failed. CloudFront authentication may be required.');
              setAuthStep(4);
            }}
          />

        </div>

        {/* JWT Token Info */}
        {jwtToken && (
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: 4,
            fontSize: '12px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#52c41a' }}>JWT Token Ready:</h4>
            <div><strong>Token Length:</strong> {jwtToken.length} characters</div>
            <div><strong>Preview:</strong> <code>{jwtToken.substring(0, 50)}...</code></div>
            <div><strong>Status:</strong> Ready for CloudFront authentication</div>
          </div>
        )}

        {/* Video Info Display */}
        {videoInfo && (
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            backgroundColor: '#e6f7ff', 
            border: '1px solid #91d5ff',
            borderRadius: 4,
            fontSize: '12px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1890ff' }}>Video Information:</h4>
            <div><strong>Title:</strong> {videoInfo.lessonTitle}</div>
            <div><strong>Duration:</strong> {videoInfo.duration} seconds</div>
            <div style={{ wordBreak: 'break-all' }}>
              <strong>HLS URL:</strong> <code>{videoInfo.hlsUrl}</code>
            </div>
          </div>
        )}

      </Card>

      {/* Authentication Modal */}
      <Modal
        title="🔐 CloudFront Authentication Required"
        open={showAuthModal}
        onCancel={() => setShowAuthModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowAuthModal(false)}>
            Cancel
          </Button>,
          <Button 
            key="auth" 
            type="primary" 
            icon={<KeyOutlined />}
            onClick={authenticateWithCloudFront}
          >
            Open Authentication Window
          </Button>
        ]}
      >
        <p>CloudFront requires JWT authentication to access the video.</p>
        <p><strong>Steps:</strong></p>
        <ol>
          <li>Click "Open Authentication Window"</li>
          <li>A new window will set the JWT cookie</li>
          <li>Close the authentication window</li>
          <li>Video should play automatically</li>
        </ol>
        <p><strong>JWT Token:</strong> <code>{jwtToken.substring(0, 30)}...</code></p>
      </Modal>
    </>
  );
};

export default VideoPlayerWithAuth;