import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Space, Tag, Alert, Steps, Spin } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, KeyOutlined, LinkOutlined, ApiOutlined } from '@ant-design/icons';

const VideoPlayerBackend = ({ lesson }) => {
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const [error, setError] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
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
      const response = await fetch(`http://localhost:8080/api/v1/public/video/lesson/${lesson.lessonId}/playback`, {
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

      if (data.status === 'success' && data.videoUrls) {
        setVideoInfo({
          hlsUrl: data.videoUrls.hls,
          dashUrl: data.videoUrls.dash,
          cookieSetterUrl: data.videoUrls.cookieSetter,
          duration: data.duration,
          lessonTitle: data.lessonTitle
        });

        console.log('🎵 Loading HLS video from backend URL:', data.videoUrls.hls);
        
        // Initialize HLS player with backend URL
        await initializeHLS(data.videoUrls.hls, data.videoUrls.cookieSetter);
        
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

  const initializeHLS = async (videoUrl, cookieSetterUrl) => {
    const video = videoRef.current;
    if (!video) return;

    // Clean up existing HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    console.log('🎵 Initializing HLS for backend URL...');

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        debug: true,
        enableWorker: true,
        lowLatencyMode: false,
        xhrSetup: function(xhr, url) {
          console.log('🌐 HLS XHR Setup for:', url);
          
          // Configure for CloudFront with JWT cookie
          xhr.withCredentials = false;
          
          // Set headers for CloudFront access
          xhr.setRequestHeader('Origin', 'http://localhost:5174');
          xhr.setRequestHeader('Referer', 'http://localhost:5174/');
          xhr.setRequestHeader('User-Agent', navigator.userAgent);
          
          // Add JWT cookie if available
          if (cookieSetterUrl && cookieSetterUrl.includes('#')) {
            const token = cookieSetterUrl.split('#')[1];
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            console.log('🔐 Added JWT token to request');
          }
        }
      });

      hlsRef.current = hls;

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ Backend HLS manifest loaded successfully');
        setError('');
        video.play().catch(e => {
          console.log('Auto-play prevented:', e);
        });
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS Error:', data);
        
        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              console.log('🔄 Network error, trying cookie setter...');
              if (cookieSetterUrl && !cookieSetterUrl.includes('localhost:5174/lesson')) {
                openCookieSetter();
              } else {
                hls.startLoad();
              }
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 Media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.log('🔄 Fatal error, trying direct video...');
              hls.destroy();
              hlsRef.current = null;
              
              // Fallback to direct video element
              video.src = videoUrl;
              video.load();
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

  const openCookieSetter = () => {
    if (videoInfo?.cookieSetterUrl) {
      console.log('🍪 Opening cookie setter:', videoInfo.cookieSetterUrl);
      window.open(videoInfo.cookieSetterUrl, '_blank', 'width=800,height=600');
    }
  };

  const testBackendAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/v1/public/video/lesson/${lesson.lessonId}/test-playback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      console.log('🧪 Backend test response:', data);
      setApiResponse(data);
    } catch (err) {
      console.error('❌ Backend test failed:', err);
      setError(`Backend test failed: ${err.message}`);
    }
    setLoading(false);
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
    { title: 'API', description: 'Backend processing' },
    { title: 'Load', description: 'Loading HLS manifest' },
    { title: 'Play', description: 'Video ready to play' },
    { title: 'Auth', description: 'Authentication needed' }
  ];

  return (
    <Card 
      title={`Backend Video Player - ${videoInfo?.lessonTitle || lesson?.lessonName || `Lesson ${lesson?.lessonId}`}`}
      extra={
        <Space>
          <Tag color="blue">Backend API</Tag>
          {videoInfo && <Tag color="green">Connected</Tag>}
          <Button 
            onClick={fetchVideoFromBackend} 
            loading={loading}
            icon={<ReloadOutlined />}
            size="small"
          >
            Retry
          </Button>
          <Button 
            onClick={openCookieSetter}
            icon={<KeyOutlined />}
            size="small"
            type="primary"
            disabled={!videoInfo?.cookieSetterUrl}
          >
            Cookie
          </Button>
          <Button 
            onClick={testBackendAPI}
            icon={<ApiOutlined />}
            size="small"
          >
            Test
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
          message="Backend Video Error"
          description={error}
          type="error"
          style={{ marginBottom: 16 }}
          action={
            <Space>
              <Button size="small" onClick={openCookieSetter} icon={<LinkOutlined />}>
                Cookie
              </Button>
              <Button size="small" onClick={testBackendAPI} icon={<ApiOutlined />}>
                Test API
              </Button>
            </Space>
          }
        />
      )}

      {/* Loading Spinner */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
          <div style={{ marginTop: 10 }}>Fetching video from backend...</div>
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
            console.log('📺 Backend video load started');
          }}
          onLoadedData={() => {
            console.log('✅ Backend video data loaded');
            setError('');
            setAuthStep(3);
          }}
          onCanPlay={() => {
            console.log('▶️ Backend video ready to play');
            setAuthStep(3);
          }}
          onError={(e) => {
            console.error('❌ Backend video error:', e);
            setError('Backend video load failed. Try cookie setter authentication.');
            setAuthStep(4);
          }}
        />

      </div>

      {/* Backend API Response Info */}
      {apiResponse && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          backgroundColor: '#f5f5f5', 
          borderRadius: 4,
          fontSize: '12px'
        }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Backend API Response:</h4>
          <div><strong>Status:</strong> {apiResponse.status}</div>
          <div><strong>Lesson:</strong> {apiResponse.lessonId} - {apiResponse.lessonTitle}</div>
          <div><strong>Course ID:</strong> {apiResponse.courseId}</div>
          {apiResponse.videoUrls && (
            <>
              <div style={{ wordBreak: 'break-all' }}>
                <strong>HLS URL:</strong> <code>{apiResponse.videoUrls.hls}</code>
              </div>
              <div><strong>Has JWT:</strong> {apiResponse.videoUrls.cookieSetter ? 'Yes' : 'No'}</div>
              <div><strong>TTL:</strong> {apiResponse.duration} seconds</div>
            </>
          )}
          {apiResponse.expectedPath && (
            <div><strong>Expected Path:</strong> {apiResponse.expectedPath}</div>
          )}
          {apiResponse.expectedM3u8 && (
            <div><strong>Expected M3U8:</strong> {apiResponse.expectedM3u8}</div>
          )}
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
          <div style={{ wordBreak: 'break-all' }}>
            <strong>DASH URL:</strong> <code>{videoInfo.dashUrl}</code>
          </div>
          {videoInfo.cookieSetterUrl && (
            <div style={{ wordBreak: 'break-all' }}>
              <strong>Cookie Setter:</strong> <code>{videoInfo.cookieSetterUrl.substring(0, 100)}...</code>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        backgroundColor: '#f6ffed', 
        border: '1px solid #b7eb8f',
        borderRadius: 4 
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#52c41a' }}>Backend Authentication Flow:</h4>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: '12px', color: '#389e0d' }}>
          <li>Backend generates JWT token and cookie setter URL</li>
          <li>Click "Cookie" button to authenticate with CloudFront</li>
          <li>Complete authentication in the popup window</li>
          <li>Return here - video should play automatically</li>
          <li>JWT token is valid for {videoInfo?.duration || 3600} seconds</li>
        </ol>
      </div>
      
    </Card>
  );
};

export default VideoPlayerBackend;