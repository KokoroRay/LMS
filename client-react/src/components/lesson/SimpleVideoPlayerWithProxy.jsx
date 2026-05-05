import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Space, Alert, Spin } from 'antd';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import Hls from 'hls.js';

const SimpleVideoPlayerWithProxy = ({ lesson }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Video mapping
  const VIDEO_MAP = {
    32: 'c0f317b9-4cbb-4d19-b27c-3dbc0a18d0f8',
    31: 'e1b29e9e-95a8-4c93-98ac-b6abfce54aad'
  };

  const loadVideoWithProxy = async () => {
    if (!lesson?.lessonId) return;

    setLoading(true);
    setError('');
    setVideoReady(false);

    try {
      const videoUuid = VIDEO_MAP[lesson.lessonId];
      if (!videoUuid) {
        throw new Error(`No video mapping for lesson ${lesson.lessonId}`);
      }

      const courseId = lesson.courseId || 3;
      const originalUrl = `https://d1ybhieu7adt5b.cloudfront.net/vod/hls/${courseId}_${lesson.lessonId}/${videoUuid}.m3u8`;
      
      // Use backend proxy
      const baseUrl = import.meta.env.VITE_API_BASE || 'https://hocvienit.id.vn';
      const proxyUrl = `${baseUrl}/api/v1/public/cloudfront-proxy?url=${encodeURIComponent(originalUrl)}`;
      
      console.log('🌐 Loading video via backend proxy:', proxyUrl);

      // Test proxy endpoint first
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.apple.mpegurl, */*'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Proxy failed: ${response.status} - ${errorText}`);
      }

      const m3u8Content = await response.text();
      console.log('✅ M3U8 content received:', m3u8Content.substring(0, 200) + '...');

      // Initialize HLS with proxy URL
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          debug: true,
          enableWorker: false,
          xhrSetup: function(xhr, url) {
            console.log('🌐 HLS XHR Setup for:', url);
            // If it's a CloudFront URL, proxy it
            if (url.includes('d1ybhieu7adt5b.cloudfront.net')) {
              const baseUrl = import.meta.env.VITE_API_BASE || 'https://hocvienit.id.vn';
              const proxiedUrl = `${baseUrl}/api/v1/public/cloudfront-proxy?url=${encodeURIComponent(url)}`;
              xhr.open('GET', proxiedUrl, true);
            }
          }
        });

        hls.loadSource(proxyUrl);
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS manifest parsed successfully');
          setVideoReady(true);
          setLoading(false);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('❌ HLS Error:', data);
          if (data.fatal) {
            setError(`HLS Error: ${data.type} - ${data.details}`);
            setLoading(false);
          }
        });

        hlsRef.current = hls;

      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        videoRef.current.src = proxyUrl;
        setVideoReady(true);
        setLoading(false);
      } else {
        throw new Error('HLS not supported in this browser');
      }

    } catch (err) {
      console.error('❌ Video load error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const playVideo = () => {
    if (videoRef.current && videoReady) {
      videoRef.current.play();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  return (
    <Card 
      title="🎬 Simple Video Player with Backend Proxy" 
      style={{ margin: '20px 0' }}
      extra={
        <Space>
          <Button 
            icon={<PlayCircleOutlined />} 
            onClick={loadVideoWithProxy}
            loading={loading}
            type="primary"
          >
            Load Video via Proxy
          </Button>
          <Button 
            icon={<PlayCircleOutlined />} 
            onClick={playVideo}
            disabled={!videoReady}
          >
            Play Video
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Space>
      }
    >
      {error && (
        <Alert 
          message="Error" 
          description={error} 
          type="error" 
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <p>Loading video via backend proxy...</p>
        </div>
      )}

      {videoReady && (
        <Alert 
          message="Video Ready" 
          description="Video loaded successfully via backend proxy. Click Play to start." 
          type="success" 
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <video
          ref={videoRef}
          controls
          style={{
            width: '100%',
            maxWidth: '800px',
            height: 'auto',
            backgroundColor: '#000'
          }}
          onLoadStart={() => console.log('📺 Video load started')}
          onCanPlay={() => console.log('✅ Video can play')}
          onError={(e) => console.error('❌ Video error:', e)}
        />
      </div>

      <div style={{ marginTop: 16, fontSize: '12px', color: '#666' }}>
        <p><strong>Lesson:</strong> {lesson?.lessonId} | <strong>Course:</strong> {lesson?.courseId || 3}</p>
        <p><strong>Video UUID:</strong> {VIDEO_MAP[lesson?.lessonId] || 'Unknown'}</p>
        <p><strong>Backend Proxy:</strong> http://localhost:8080/api/v1/public/cloudfront-proxy</p>
      </div>
    </Card>
  );
};

export default SimpleVideoPlayerWithProxy;