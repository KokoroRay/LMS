import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Space, Tag, Alert, Steps } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, ExperimentOutlined, CheckCircleOutlined } from '@ant-design/icons';

const VideoPlayerCORSBypass = ({ lesson }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const [error, setError] = useState('');
  const [bypassMethod, setBypassMethod] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const iframeRef = useRef(null);

  // CloudFront video mapping
  const VIDEO_MAP = {
    32: 'c0f317b9-4cbb-4d19-b27c-3dbc0a18d0f8',
    31: 'e1b29e9e-95a8-4c93-98ac-b6abfce54aad'
  };

  const tryMultipleBypassMethods = async () => {
    if (!lesson?.lessonId) return;
    
    setLoading(true);
    setError('');
    setAuthStep(1);
    
    const videoUuid = VIDEO_MAP[lesson.lessonId];
    if (!videoUuid) {
      setError(`No video mapping for lesson ${lesson.lessonId}`);
      setLoading(false);
      return;
    }

    const courseId = lesson.courseId || 3;
    const cloudFrontUrl = `https://d1ybhieu7adt5b.cloudfront.net/vod/hls/${courseId}_${lesson.lessonId}/${videoUuid}.m3u8`;
    setVideoUrl(cloudFrontUrl);

    console.log('🚀 Trying multiple CORS bypass methods...');
    
    // Method 1: Try backend proxy
    if (await tryBackendProxy(cloudFrontUrl)) return;
    
    // Method 2: Try iframe navigation
    if (await tryIframeNavigation(cloudFrontUrl)) return;
    
    // Method 3: Try direct video element (may work for some browsers)
    if (await tryDirectVideo(cloudFrontUrl)) return;
    
    // Method 4: Try server-side fetch
    if (await tryServerSideFetch(cloudFrontUrl)) return;
    
    setError('All CORS bypass methods failed. CloudFront requires proper authentication.');
    setAuthStep(5);
    setLoading(false);
  };

  const tryBackendProxy = async (cloudFrontUrl) => {
    try {
      setAuthStep(2);
      setBypassMethod('Backend Proxy');
      console.log('🔄 Method 1: Backend proxy...');
      
      // Get JWT token from backend first
      const baseUrl = import.meta.env.VITE_API_BASE || 'https://hocvienit.id.vn';
      const backendResponse = await fetch(`${baseUrl}/api/v1/lessons/${lesson.lessonId}/video/public-playback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        if (data.status === 'success' && data.streamingUrl) {
          // Use backend-provided URL (may have signed URLs or proxy)
          setProxyUrl(data.streamingUrl);
          
          // Try to use backend as proxy for CloudFront
          const baseUrl = import.meta.env.VITE_API_BASE || 'https://hocvienit.id.vn';
          const proxyResponse = await fetch(`${baseUrl}/api/v1/public/video/proxy?url=${encodeURIComponent(cloudFrontUrl)}`, {
            method: 'GET'
          });
          
          if (proxyResponse.ok) {
            console.log('✅ Backend proxy works!');
            await initializeVideo(data.streamingUrl);
            return true;
          }
        }
      }
    } catch (err) {
      console.log('❌ Backend proxy failed:', err.message);
    }
    return false;
  };

  const tryIframeNavigation = async (cloudFrontUrl) => {
    try {
      setAuthStep(3);
      setBypassMethod('Iframe Navigation');
      console.log('🔄 Method 2: Iframe navigation...');
      
      return new Promise((resolve) => {
        const iframe = iframeRef.current;
        if (!iframe) {
          resolve(false);
          return;
        }

        // Create HTML that will navigate to CloudFront with proper referrer
        const iframeContent = `
          <!DOCTYPE html>
          <html>
          <head><title>CloudFront Navigation</title></head>
          <body>
            <script>
              // Navigate to CloudFront URL to establish proper referrer context
              window.location.href = '${cloudFrontUrl}';
              
              // Listen for any success
              setTimeout(() => {
                parent.postMessage({ type: 'navigation-complete', success: true }, '*');
              }, 3000);
            </script>
          </body>
          </html>
        `;
        
        iframe.srcdoc = iframeContent;
        iframe.style.display = 'block';
        
        const messageHandler = (event) => {
          if (event.data.type === 'navigation-complete') {
            iframe.style.display = 'none';
            window.removeEventListener('message', messageHandler);
            
            // Try to access CloudFront after iframe navigation
            setTimeout(async () => {
              try {
                const testResponse = await fetch(cloudFrontUrl, { method: 'HEAD' });
                if (testResponse.ok) {
                  console.log('✅ Iframe navigation bypass works!');
                  await initializeVideo(cloudFrontUrl);
                  resolve(true);
                } else {
                  resolve(false);
                }
              } catch {
                resolve(false);
              }
            }, 1000);
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          iframe.style.display = 'none';
          resolve(false);
        }, 10000);
      });
      
    } catch (err) {
      console.log('❌ Iframe navigation failed:', err.message);
    }
    return false;
  };

  const tryDirectVideo = async (cloudFrontUrl) => {
    try {
      setAuthStep(4);
      setBypassMethod('Direct Video');
      console.log('🔄 Method 3: Direct video element...');
      
      return new Promise((resolve) => {
        const video = videoRef.current;
        if (!video) {
          resolve(false);
          return;
        }

        // Try direct video loading (some browsers may allow)
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';
        
        const successHandler = () => {
          console.log('✅ Direct video access works!');
          video.removeEventListener('loadeddata', successHandler);
          video.removeEventListener('error', errorHandler);
          resolve(true);
        };
        
        const errorHandler = () => {
          video.removeEventListener('loadeddata', successHandler);
          video.removeEventListener('error', errorHandler);
          resolve(false);
        };
        
        video.addEventListener('loadeddata', successHandler);
        video.addEventListener('error', errorHandler);
        
        video.src = cloudFrontUrl;
        video.load();
        
        // Timeout after 5 seconds
        setTimeout(() => {
          video.removeEventListener('loadeddata', successHandler);
          video.removeEventListener('error', errorHandler);
          resolve(false);
        }, 5000);
      });
      
    } catch (err) {
      console.log('❌ Direct video failed:', err.message);
    }
    return false;
  };

  const tryServerSideFetch = async (cloudFrontUrl) => {
    try {
      setBypassMethod('Server-Side Fetch');
      console.log('🔄 Method 4: Server-side fetch...');
      
      // Try to get backend to fetch CloudFront URL server-side
      const baseUrl = import.meta.env.VITE_API_BASE || 'https://hocvienit.id.vn';
      const response = await fetch(`${baseUrl}/api/v1/public/video/fetch-cloudfront`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cloudFrontUrl,
          lessonId: lesson.lessonId,
          courseId: lesson.courseId || 3
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.proxyUrl) {
          console.log('✅ Server-side fetch works!');
          await initializeVideo(data.proxyUrl);
          return true;
        }
      }
      
    } catch (err) {
      console.log('❌ Server-side fetch failed:', err.message);
    }
    return false;
  };

  const initializeVideo = async (videoUrl) => {
    const video = videoRef.current;
    if (!video) return;

    console.log('🎵 Initializing video with URL:', videoUrl);
    
    // Clean up existing HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        debug: false,
        enableWorker: true,
        xhrSetup: function(xhr, url) {
          // Don't set forbidden headers - let browser handle automatically
          xhr.withCredentials = false;
          console.log('🌐 HLS loading:', url);
        }
      });

      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ Video manifest loaded successfully!');
        setError('');
        setAuthStep(4);
        setLoading(false);
        video.play().catch(e => console.log('Auto-play prevented:', e));
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS Error:', data);
        if (data.fatal) {
          setError(`HLS error: ${data.details}`);
          setLoading(false);
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = videoUrl;
      video.load();
      setAuthStep(4);
      setLoading(false);
    } else {
      setError('HLS not supported in this browser');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lesson) {
      tryMultipleBypassMethods();
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
    { title: 'Start', description: 'Initiating bypass methods' },
    { title: 'Proxy', description: 'Trying backend proxy' },
    { title: 'Navigate', description: 'Iframe navigation' },
    { title: 'Play', description: 'Video loading' },
    { title: 'Failed', description: 'All methods failed' }
  ];

  return (
    <>
      <Card 
        title={`🚀 CORS Bypass Player - ${lesson?.lessonName || `Lesson ${lesson?.lessonId}`}`}
        extra={
          <Space>
            <Tag color="red">CORS Bypass</Tag>
            {bypassMethod && <Tag color="blue">{bypassMethod}</Tag>}
            <Button 
              onClick={tryMultipleBypassMethods} 
              loading={loading}
              icon={<ReloadOutlined />}
              size="small"
            >
              Retry All
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
            message="CORS Bypass Failed"
            description={error}
            type="error"
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" onClick={tryMultipleBypassMethods} icon={<ExperimentOutlined />}>
                Try Again
              </Button>
            }
          />
        )}

        {/* Hidden Iframe for navigation bypass */}
        <iframe
          ref={iframeRef}
          style={{
            width: '100%',
            height: '100px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            marginBottom: '16px',
            display: 'none'
          }}
          title="CORS Bypass Navigation"
        />

        <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' }}>
          
          {loading && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              zIndex: 10
            }}>
              <div style={{ textAlign: 'center' }}>
                <ExperimentOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                <div>Trying CORS bypass methods...</div>
                {bypassMethod && <div style={{ fontSize: '12px', opacity: 0.7 }}>Current: {bypassMethod}</div>}
              </div>
            </div>
          )}

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
            onLoadStart={() => console.log('📺 Video load started')}
            onLoadedData={() => console.log('✅ Video data loaded')}
            onCanPlay={() => console.log('▶️ Video ready to play')}
            onError={(e) => console.error('❌ Video error:', e)}
          />

        </div>

        {/* Method Results */}
        {videoUrl && (
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 4,
            fontSize: '12px'
          }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Bypass Method Results:</h4>
            <div><strong>Original URL:</strong> <code style={{ wordBreak: 'break-all' }}>{videoUrl}</code></div>
            {proxyUrl && <div><strong>Proxy URL:</strong> <code>{proxyUrl}</code></div>}
            <div><strong>Method Used:</strong> {bypassMethod || 'None successful'}</div>
            <div><strong>Status:</strong> {error ? '❌ Failed' : loading ? '⏳ In Progress' : '✅ Success'}</div>
          </div>
        )}

        {/* Instructions */}
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          backgroundColor: '#fff2e8', 
          border: '1px solid #ffbb96',
          borderRadius: 4 
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#d46b08' }}>CORS Bypass Methods:</h4>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: '12px', color: '#ad4e00' }}>
            <li><strong>Backend Proxy:</strong> Use backend server to fetch CloudFront content</li>
            <li><strong>Iframe Navigation:</strong> Navigate to CloudFront to establish proper referrer</li>
            <li><strong>Direct Video:</strong> Try direct video element (limited browser support)</li>
            <li><strong>Server-Side Fetch:</strong> Backend fetches and serves content</li>
          </ol>
        </div>
        
      </Card>
    </>
  );
};

export default VideoPlayerCORSBypass;