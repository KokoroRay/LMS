import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Space, Tag, Alert, Steps, Spin } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, KeyOutlined, CheckOutlined } from '@ant-design/icons';

const VideoPlayerJWT = ({ lesson }) => {
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const [error, setError] = useState('');
  const [jwtToken, setJwtToken] = useState('');
  const [cookieSet, setCookieSet] = useState(false);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const iframeRef = useRef(null);

  const fetchVideoFromBackend = async () => {
    if (!lesson?.lessonId) return;
    
    setLoading(true);
    setError('');
    setAuthStep(1);
    
    try {
      console.log('🔗 Fetching JWT-enabled video from backend...');
      
      const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/v1/lessons/${lesson.lessonId}/video/public-playback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      console.log('✅ Backend API response:', data);
      
      setAuthStep(2);

      if (data.status === 'success' && data.streamingUrl) {
        setVideoInfo({
          hlsUrl: data.streamingUrl,
          cookieSetterUrl: data.cookieSetterUrl,
          duration: data.duration,
          lessonTitle: data.lessonTitle
        });

        // Extract JWT token
        if (data.cookieSetterUrl && data.cookieSetterUrl.includes('#')) {
          const token = data.cookieSetterUrl.split('#')[1];
          setJwtToken(token);
          console.log('🔐 JWT token extracted:', token.substring(0, 50) + '...');
          
          // Auto-trigger cookie setting process
          setAuthStep(3);
          await setCloudFrontCookieViaProxy(token, data.videoUrls.hls);
        }
      } else {
        throw new Error(data.message || 'Failed to get video URLs');
      }

      setLoading(false);
      
    } catch (err) {
      console.error('❌ Backend failed:', err);
      setError(`Backend error: ${err.message}`);
      setLoading(false);
      setAuthStep(5);
    }
  };

  const setCloudFrontCookieViaProxy = async (token, videoUrl) => {
    try {
      console.log('🍪 Setting CloudFront cookie via proxy method...');
      
      // Method 1: Create authenticated fetch request with JWT token
      const authenticatedRequest = async () => {
        try {
          const response = await fetch(videoUrl, {
            method: 'HEAD',
            headers: {
              'Origin': 'http://localhost:5173',
              'Referer': 'http://localhost:5173/',
              'User-Agent': navigator.userAgent + ' development-bypass'
            },
            credentials: 'include'
          });
          
          console.log('🔐 CloudFront auth response status:', response.status);
          
          if (response.ok || response.status === 200) {
            setCookieSet(true);
            setAuthStep(4);
            console.log('✅ CloudFront authentication successful!');
            
            // Now load the video
            await initializeAuthenticatedHLS(videoUrl, token);
            return true;
          }
        } catch (authError) {
          console.log('⚠️ Direct auth failed:', authError.message);
        }
        return false;
      };

      // Try authenticated request first
      const directAuthSuccess = await authenticatedRequest();
      
      if (!directAuthSuccess) {
        // Method 2: Use iframe cookie setter as fallback
        console.log('🔄 Fallback to iframe cookie setter...');
        createCookieSetterIframe(token, videoUrl);
      }
      
    } catch (error) {
      console.error('❌ Cookie setting failed:', error);
      setError('JWT cookie setup failed. Try manual authentication.');
      setAuthStep(5);
    }
  };

  const createCookieSetterIframe = (token, videoUrl) => {
    console.log('🖼️ Creating cookie setter iframe...');
    
    // Create cookie setter HTML that will run on localhost (same origin)
    const cookieSetterHTML = `
      <!DOCTYPE html>
      <html>
      <head><title>JWT Cookie Setter</title></head>
      <body>
        <div style="font-family: Arial; padding: 20px; text-align: center;">
          <h3>🔐 Setting CloudFront JWT Cookie</h3>
          <p id="status">Initializing...</p>
          <div id="progress" style="background: #f0f0f0; height: 4px; border-radius: 2px; margin: 20px 0;">
            <div style="background: #1890ff; height: 100%; width: 0%; border-radius: 2px; transition: width 1s;" id="bar"></div>
          </div>
        </div>
        <script>
          (function() {
            const updateStatus = (msg, width = 0) => {
              document.getElementById('status').textContent = msg;
              document.getElementById('bar').style.width = width + '%';
            };
            
            try {
              updateStatus('Setting JWT cookies...', 25);
              
              // Set multiple cookie formats for CloudFront
              const token = '${token}';
              const cookies = [
                'CloudFront-Policy=' + token + '; Path=/; SameSite=None; Secure',
                'AuthToken=' + token + '; Path=/; SameSite=None; Secure',
                'jwt=' + token + '; Path=/; SameSite=None; Secure',
                'Authorization=Bearer ' + token + '; Path=/; SameSite=None; Secure'
              ];
              
              cookies.forEach((cookie, i) => {
                document.cookie = cookie;
                updateStatus('Setting cookie ' + (i + 1) + '/' + cookies.length + '...', 25 + (i * 15));
              });
              
              updateStatus('Verifying cookies...', 75);
              
              // Verify cookies
              const allCookies = document.cookie;
              console.log('🍪 Set cookies:', allCookies);
              
              updateStatus('✅ JWT cookies set successfully!', 100);
              
              // Notify parent about completion
              setTimeout(() => {
                parent.postMessage({
                  type: 'jwt-cookie-set',
                  token: token,
                  cookies: allCookies,
                  videoUrl: '${videoUrl}'
                }, '*');
              }, 500);
              
            } catch (error) {
              updateStatus('❌ Error: ' + error.message, 0);
              console.error('Cookie setter error:', error);
              
              parent.postMessage({
                type: 'jwt-cookie-error',
                error: error.message
              }, '*');
            }
          })();
        </script>
      </body>
      </html>
    `;

    // Create iframe with the cookie setter
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.srcdoc = cookieSetterHTML;
      iframe.style.display = 'block';
    }
  };

  const handleIframeMessage = (event) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'jwt-cookie-set') {
      console.log('✅ Received cookie set confirmation from iframe');
      setCookieSet(true);
      setAuthStep(4);
      
      // Hide iframe and initialize video
      if (iframeRef.current) {
        iframeRef.current.style.display = 'none';
      }
      
      // Initialize video with authentication
      initializeAuthenticatedHLS(event.data.videoUrl, event.data.token);
      
    } else if (event.data.type === 'jwt-cookie-error') {
      console.error('❌ Cookie setting failed in iframe:', event.data.error);
      setError('JWT cookie setup failed in iframe: ' + event.data.error);
      setAuthStep(5);
    }
  };

  const initializeAuthenticatedHLS = async (videoUrl, token) => {
    const video = videoRef.current;
    if (!video) return;

    // Clean up existing HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    console.log('🎵 Initializing authenticated HLS player...');

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        debug: true,
        enableWorker: true,
        xhrSetup: function(xhr, url) {
          console.log('🌐 Authenticated XHR setup for:', url);
          
          // Include cookies and JWT token
          xhr.withCredentials = true;
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.setRequestHeader('Origin', 'http://localhost:5173');
          xhr.setRequestHeader('Referer', 'http://localhost:5173/');
          xhr.setRequestHeader('X-CloudFront-JWT', token);
          
          console.log('🔐 Added JWT authentication headers');
        }
      });

      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ Authenticated HLS manifest loaded!');
        setError('');
        setAuthStep(4);
        video.play().catch(e => console.log('Auto-play prevented:', e));
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        console.error('❌ Authenticated HLS error:', data);
        
        if (data.fatal) {
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            setError('CloudFront access denied. JWT authentication may have failed.');
            setAuthStep(5);
          }
        }
      });
    }
  };

  const retryWithManualAuth = () => {
    if (!jwtToken || !videoInfo?.hlsUrl) return;
    
    console.log('🔄 Retrying with manual authentication...');
    setError('');
    setAuthStep(3);
    
    // Try the cookie setting process again
    setCloudFrontCookieViaProxy(jwtToken, videoInfo.hlsUrl);
  };

  useEffect(() => {
    if (lesson) {
      fetchVideoFromBackend();
    }
  }, [lesson]);

  useEffect(() => {
    // Listen for iframe messages
    window.addEventListener('message', handleIframeMessage);
    
    return () => {
      window.removeEventListener('message', handleIframeMessage);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  const steps = [
    { title: 'Start', description: 'Loading backend data' },
    { title: 'JWT', description: 'Getting JWT token' },
    { title: 'Cookie', description: 'Setting CloudFront cookie' },
    { title: 'Play', description: 'Video authenticated' },
    { title: 'Error', description: 'Authentication failed' }
  ];

  return (
    <Card 
      title={`🔐 JWT Video Player - ${videoInfo?.lessonTitle || lesson?.lessonName || `Lesson ${lesson?.lessonId}`}`}
      extra={
        <Space>
          <Tag color="purple">JWT Auth</Tag>
          {jwtToken && <Tag color="blue">Token Ready</Tag>}
          {cookieSet && <Tag color="green">Authenticated</Tag>}
          <Button 
            onClick={fetchVideoFromBackend} 
            loading={loading}
            icon={<ReloadOutlined />}
            size="small"
          >
            Retry
          </Button>
          <Button 
            onClick={retryWithManualAuth}
            icon={<KeyOutlined />}
            size="small"
            type="primary"
            disabled={!jwtToken}
          >
            Re-auth
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
          message="JWT Authentication Error"
          description={error}
          type="error"
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={retryWithManualAuth} icon={<KeyOutlined />}>
              Retry Auth
            </Button>
          }
        />
      )}

      {/* Loading Spinner */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
          <div style={{ marginTop: 10 }}>Setting up JWT authentication...</div>
        </div>
      )}

      {/* Cookie Setter Iframe */}
      <iframe
        ref={iframeRef}
        style={{
          width: '100%',
          height: '120px',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          marginBottom: '16px',
          display: 'none'
        }}
        title="JWT Cookie Setter"
      />

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
            console.log('📺 JWT video load started');
          }}
          onLoadedData={() => {
            console.log('✅ JWT video data loaded');
            setError('');
            setAuthStep(4);
          }}
          onCanPlay={() => {
            console.log('▶️ JWT video ready to play');
            setAuthStep(4);
          }}
          onError={(e) => {
            console.error('❌ JWT video error:', e);
            setError('Video load failed despite JWT authentication.');
            setAuthStep(5);
          }}
        />

      </div>

      {/* Authentication Status */}
      {jwtToken && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          backgroundColor: cookieSet ? '#f6ffed' : '#fff7e6', 
          border: `1px solid ${cookieSet ? '#b7eb8f' : '#ffd591'}`,
          borderRadius: 4,
          fontSize: '12px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: cookieSet ? '#52c41a' : '#fa8c16' }}>
            JWT Authentication Status:
          </h4>
          <div><strong>Token:</strong> <code>{jwtToken.substring(0, 30)}...</code></div>
          <div><strong>Status:</strong> {cookieSet ? '✅ Cookie Set' : '⏳ Setting Cookie...'}</div>
          {videoInfo && (
            <div><strong>Video:</strong> <code>{videoInfo.hlsUrl}</code></div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        backgroundColor: '#e6f7ff', 
        border: '1px solid #91d5ff',
        borderRadius: 4 
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#1890ff' }}>JWT Authentication Process:</h4>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: '12px', color: '#096dd9' }}>
          <li>Backend generates JWT token for CloudFront access</li>
          <li>System automatically sets JWT cookie via iframe</li>
          <li>CloudFront Lambda@Edge validates JWT token</li>
          <li>Video streams with authenticated access</li>
          <li>If failed, click "Re-auth" to retry authentication</li>
        </ol>
      </div>
      
    </Card>
  );
};

export default VideoPlayerJWT;