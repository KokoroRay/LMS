import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button, Slider, Select, message } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseOutlined, 
  SoundOutlined, 
  MutedOutlined,
  FullscreenOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import Hls from 'hls.js';

const { Option } = Select;

// Direct video mapping for development
const VIDEO_MAP = {
  31: 'e1b29e9e-95a8-4c93-98ac-b6abfce54aad',
  32: 'c0f317b9-4cbb-4d19-b27c-3dbc0a18d0f8'
};

const VideoPlayerCloudFront = ({ lesson }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Quality and HLS state
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState('auto');

  // Generate CloudFront URL
  const getVideoUrl = useCallback((lessonId) => {
    const videoId = VIDEO_MAP[lessonId];
    if (!videoId) return null;
    
    const courseId = lesson?.courseId || 3;
    return `https://d1ybhieu7adt5b.cloudfront.net/vod/hls/${courseId}_${lessonId}/${videoId}.m3u8`;
  }, [lesson?.courseId]);

  // Initialize HLS player
  const initHLS = useCallback((videoUrl) => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    console.log('🎬 Initializing HLS player for:', videoUrl);

    // Clean up existing instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        xhrSetup: (xhr, url) => {
          // Do not set custom headers to avoid CORS preflight
          console.log('🔗 HLS XHR setup for:', url);
        }
      });

      hlsRef.current = hls;

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('✅ HLS media attached');
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log('✅ HLS manifest parsed:', data);
        setIsLoading(false);
        
        // Extract quality levels
        const levels = data.levels.map((level, index) => ({
          index,
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
          label: `${level.height}p`
        }));
        
        setQualities([
          { index: -1, label: 'Auto' },
          ...levels
        ]);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS Error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      console.log('🍎 Using native HLS support');
      video.src = videoUrl;
      setIsLoading(false);
    } else {
      console.error('❌ HLS not supported');
      message.error('HLS video playback not supported in this browser');
    }
  }, []);

  // Initialize player when lesson changes
  useEffect(() => {
    if (!lesson?.lessonId) return;

    const videoUrl = getVideoUrl(lesson.lessonId);
    if (videoUrl) {
      initHLS(videoUrl);
    } else {
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [lesson?.lessonId, getVideoUrl, initHLS]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  // Play/Pause toggle
  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (error) {
      console.error('Play/pause error:', error);
    }
  };

  // Seek to time - NO RESTRICTIONS (as requested)
  const handleSeek = (value) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const targetTime = (value / 100) * duration;
    video.currentTime = targetTime;
  };

  // Volume control
  const handleVolumeChange = (value) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = value / 100;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Mute toggle
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  // Quality change
  const handleQualityChange = (qualityIndex) => {
    if (!hlsRef.current) return;

    if (qualityIndex === -1) {
      hlsRef.current.currentLevel = -1;
      setCurrentQuality('auto');
    } else {
      hlsRef.current.currentLevel = qualityIndex;
      setCurrentQuality(qualityIndex);
    }
  };

  // Playback rate change
  const handlePlaybackRateChange = (rate) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Format time helper
  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!lesson) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 400,
        background: '#f5f5f5',
        borderRadius: 8
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📺</div>
          <div>No lesson selected</div>
        </div>
      </div>
    );
  }

  const videoUrl = getVideoUrl(lesson.lessonId);
  
  if (!videoUrl) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 400,
        background: '#000',
        borderRadius: 8,
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <div>Video not available for lesson {lesson.lessonId}</div>
        </div>
      </div>
    );
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#000',
        borderRadius: 8,
        overflow: 'hidden',
        aspectRatio: '16/9',
        maxWidth: '100%'
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          cursor: 'pointer'
        }}
        onClick={togglePlay}
        playsInline
        preload="metadata"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white'
        }}>
          <LoadingOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>Loading video...</div>
        </div>
      )}

      {/* Controls */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
        padding: '20px',
        color: 'white'
      }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: 16 }}>
          <Slider
            min={0}
            max={100}
            value={progressPercentage}
            onChange={handleSeek}
            tooltip={{
              formatter: (value) => {
                const time = (value / 100) * duration;
                return formatTime(time);
              }
            }}
            style={{ margin: 0 }}
          />
        </div>

        {/* Control Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Left Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
              onClick={togglePlay}
              style={{ color: 'white', fontSize: 20 }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                type="text"
                icon={isMuted ? <MutedOutlined /> : <SoundOutlined />}
                onClick={toggleMute}
                style={{ color: 'white' }}
              />
              <Slider
                min={0}
                max={100}
                value={isMuted ? 0 : volume * 100}
                onChange={handleVolumeChange}
                style={{ width: 80 }}
              />
            </div>

            <span style={{ fontSize: 14 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Playback Speed */}
            <Select
              value={playbackRate}
              onChange={handlePlaybackRateChange}
              size="small"
              style={{ width: 70 }}
            >
              <Option value={0.5}>0.5x</Option>
              <Option value={0.75}>0.75x</Option>
              <Option value={1}>1x</Option>
              <Option value={1.25}>1.25x</Option>
              <Option value={1.5}>1.5x</Option>
              <Option value={2}>2x</Option>
            </Select>

            {/* Quality Selector */}
            {qualities.length > 1 && (
              <Select
                value={currentQuality}
                onChange={handleQualityChange}
                size="small"
                style={{ width: 80 }}
              >
                {qualities.map((quality) => (
                  <Option key={quality.index} value={quality.index}>
                    {quality.label}
                  </Option>
                ))}
              </Select>
            )}

            <Button
              type="text"
              icon={<FullscreenOutlined />}
              onClick={toggleFullscreen}
              style={{ color: 'white' }}
            />
          </div>
        </div>
      </div>

      {/* Lesson Info */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: 6,
        fontSize: 14
      }}>
        Lesson {lesson.lessonId}: {lesson.lessonName || 'Video Lesson'}
      </div>
    </div>
  );
};

export default VideoPlayerCloudFront;