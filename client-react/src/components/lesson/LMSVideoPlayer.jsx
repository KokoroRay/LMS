import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button, Slider, Select, Progress } from "antd";
import {
  PlayCircleOutlined,
  PauseOutlined,
  SoundOutlined,
  MutedOutlined,
  FullscreenOutlined,
  LoadingOutlined,
  FastBackwardOutlined,
  FastForwardOutlined,
} from "@ant-design/icons";
import Hls from "hls.js";
import progressService from "../../services/progressService";
import authUtils from "../../utils/authUtils";
import { getVideoPlayback, getBackendProxyVideo, getDynamicCloudFrontVideoUrl, getCloudFrontVideoUrlWithFallbacks } from "../../services/lessonService";
import NoskipVideoModal from "../modal/NoskipVideoModal"; 
import "./VideoPlayerStyles.css";

const { Option } = Select;

const LMSVideoPlayer = ({ lesson, userId, onProgress, onVideoEnd }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [isSkipModalVisible, setIsSkipModalVisible] = useState(false); // State for the modal
  const [videoEnded, setVideoEnded] = useState(false);

  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState("auto");
  const [dynamicVideoUrl, setDynamicVideoUrl] = useState(null);
  const [videoError, setVideoError] = useState(null);

  // Dynamic video URL loading from API
  const loadVideoUrl = useCallback(async (lessonId) => {
    if (!lessonId) return null;
    
    setIsLoading(true);
    setVideoError(null);
    
    try {
      // Try primary API first
      const playbackData = await getVideoPlayback(lessonId);
      
      if (playbackData?.hlsUrl) {
        setDynamicVideoUrl(playbackData.hlsUrl);
        return playbackData.hlsUrl;
      }
      
      // Fallback to backend proxy
      const proxyResult = await getBackendProxyVideo(lessonId);
      
      if (proxyResult?.success && proxyResult?.blobUrl) {
        setDynamicVideoUrl(proxyResult.blobUrl);
        return proxyResult.blobUrl;
      }
      
      throw new Error('No video URL available from API');
      
    } catch (error) {
      console.error('Failed to load video URL:', error);
      
      // Final fallback to dynamic CloudFront direct URL with multiple attempts
      try {
        const cloudFrontUrl = await getCloudFrontVideoUrlWithFallbacks(lessonId);
        if (cloudFrontUrl) {
          console.log('✅ Using dynamic CloudFront fallback:', cloudFrontUrl);
          setDynamicVideoUrl(cloudFrontUrl);
          setIsLoading(false);
          return cloudFrontUrl;
        }
      } catch (cfError) {
        console.error('❌ All CloudFront fallbacks failed:', cfError);
      }
      
      setVideoError('Không thể tải video từ tất cả nguồn. Vui lòng thử lại sau.');
      setIsLoading(false);
      return null;
    }
  }, []);

  const initHLS = useCallback((videoUrl) => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        xhrSetup: () => {},
      });

      hlsRef.current = hls;

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsLoading(false);

        const levels = data.levels.map((level, index) => ({
          index,
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
          label: `${level.height}p`,
        }));

        setQualities([{ index: -1, label: "Auto" }, ...levels]);

        let checkCount = 0;
        const checkDuration = () => {
          checkCount++;
          if (video.duration && isFinite(video.duration)) {
            setDuration(video.duration);
            setIsLoading(false);
          } else if (checkCount < 20) {
            setTimeout(checkDuration, 250);
          } else {
            setIsLoading(false);
          }
        };
        setTimeout(checkDuration, 100);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
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
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;

      // For native video playback, also check duration
      let checkCount = 0;
      const checkDuration = () => {
        checkCount++;
        if (video.duration && isFinite(video.duration)) {
          setDuration(video.duration);
          setIsLoading(false);
        } else if (checkCount < 20) {
          setTimeout(checkDuration, 250);
        } else {
          setIsLoading(false);
        }
      };
      setTimeout(checkDuration, 100);
    }
  }, []);

  useEffect(() => {
    if (!lesson?.lessonId) {
      setProgressLoaded(true);
      return;
    }

    const loadProgress = async () => {
      if (!userId) {
        setProgressLoaded(true);
        return;
      }

      try {
        const progress = await progressService.getLessonProgress(
          userId,
          lesson.lessonId
        );
        if (progress.watchedSeconds > 0) {
          setMaxWatchedTime(progress.watchedSeconds);
        }
        setProgressLoaded(true);
      } catch (error) {
        setProgressLoaded(true);
      }
    };

    loadProgress();
  }, [lesson?.lessonId, userId]);

  useEffect(() => {
    if (!lesson?.lessonId || !progressLoaded) return;

    const initializeVideo = async () => {
      await loadVideoUrl();
    };

    initializeVideo();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [lesson?.lessonId, progressLoaded, initHLS]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
        setIsLoading(false);
      } else {
        setTimeout(() => {
          if (video.duration && isFinite(video.duration)) {
            setDuration(video.duration);
            setIsLoading(false);
          }
        }, 500);
      }
    };

    const handleCanPlay = () => {
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
      }
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

   const handleVideoEnd = async () => {
  const video = videoRef.current;
  if (!video) return;

    const finalDuration = video.duration && isFinite(video.duration)

      ? video.duration

      : currentTime;

  

    console.log("handleVideoEnd triggered:");

    console.log("  video.duration:", video.duration);

    console.log("  video.currentTime:", video.currentTime);

    console.log("  finalDuration:", finalDuration);

  

    // Use lesson.durationMinutes as the primary source of truth for total video duration if available

    const expectedDurationSeconds = lesson?.durationMinutes ? lesson.durationMinutes * 60 : finalDuration;

    console.log("  expectedDurationSeconds (from lesson):", expectedDurationSeconds);

  

    // Add a small tolerance to check if the video has truly completed

    // If the video stops 1 second early, currentTime will be less than finalDuration - 0.5

    const isTrulyCompleted =

      expectedDurationSeconds > 0 && video.currentTime >= expectedDurationSeconds - 0.5;

    console.log("  isTrulyCompleted based on expectedDurationSeconds:", isTrulyCompleted);

  

    // Pause the video to stop playback

    video.pause();

    setIsPlaying(false);

  

    // Cập nhật state để UI nhảy lên full

    setCurrentTime(expectedDurationSeconds); // Update current time to the expected end

    setMaxWatchedTime(expectedDurationSeconds); // Update max watched time to the expected end

  

    if (lesson?.lessonId && userId) {

      // Ensure progressTime does not exceed the expected duration

      const progressTime = Math.min(Math.floor(video.currentTime), expectedDurationSeconds);

      console.log("  progressTime (watchedSeconds):", progressTime);

      console.log("  isTrulyCompleted:", isTrulyCompleted);

      if (onVideoEnd) {

        onVideoEnd(progressTime, isTrulyCompleted);

      } else {

        await progressService.updateProgressImmediate(

          userId,

          lesson.lessonId,

          progressTime,

          isTrulyCompleted

        );

      }

    }
};


    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);

      // Ensure duration is set if not already
      if (duration === 0 && video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
      }

      if (time > maxWatchedTime) {
        const newMaxTime = time;
        setMaxWatchedTime(newMaxTime);

        if (lesson?.lessonId && userId) {
          const progressTime = Math.floor(newMaxTime);
          if (onProgress) {
            onProgress(progressTime, false);
          } else {
            progressService.updateProgressDebounced(
              userId,
              lesson.lessonId,
              progressTime,
              false
            );
          }
        }
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleError = (e) => {
      setIsLoading(false);
      if (e.target.error && e.target.error.code === 4) {
        setTimeout(() => {
          if (lesson?.lessonId) {
            loadVideoUrl(lesson.lessonId);
          }
        }, 2000);
      }
    };

    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleVideoEnd);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleVideoEnd);
      video.removeEventListener("error", handleError);
    };
  }, [
    lesson?.lessonId,
    userId,
    onProgress,
    onVideoEnd,
    maxWatchedTime,
    currentTime,
    duration,
    initHLS,
    loadVideoUrl,
  ]);

  // Load video URL dynamically when lesson changes
  useEffect(() => {
    if (lesson?.lessonId) {
      loadVideoUrl(lesson.lessonId);
    }
  }, [lesson?.lessonId, loadVideoUrl]);

  // Initialize HLS when video URL is loaded
  useEffect(() => {
    if (dynamicVideoUrl) {
      initHLS(dynamicVideoUrl);
    }
  }, [dynamicVideoUrl, initHLS]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } else {
        video.pause();
        if (lesson?.lessonId && userId) {
          const progressTime = Math.floor(video.currentTime);
          if (onProgress) {
            onProgress(progressTime, false);
          } else {
            await progressService.updateProgressImmediate(
              userId,
              lesson.lessonId,
              progressTime,
              false
            );
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleSeek = async (value) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const targetTime = (value / 100) * duration;

    if (targetTime <= maxWatchedTime) {
      video.currentTime = targetTime;
      setCurrentTime(targetTime);

      if (lesson?.lessonId && userId) {
        const progressTime = Math.floor(targetTime);
        if (onProgress) {
          onProgress(progressTime, false);
        } else {
          await progressService.updateProgressImmediate(
            userId,
            lesson.lessonId,
            progressTime,
            false
          );
        }
      }
    } else if (targetTime >= duration - 0.1) {
      // Allow seeking to the very end without updating progress
      video.currentTime = targetTime;
      setCurrentTime(targetTime);
    } else {
      setIsSkipModalVisible(true);
    }
  };

  const skipBackward = async () => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(0, video.currentTime - 5);
    video.currentTime = newTime;
    setCurrentTime(newTime);

    if (lesson?.lessonId && userId) {
      await progressService.updateProgressImmediate(
        userId,
        lesson.lessonId,
        Math.floor(newTime),
        false
      );
    }
  };

  const skipForward = async () => {
    const video = videoRef.current;
    if (!video) return;

    const targetTime = video.currentTime + 5;
    const newTime = Math.min(targetTime, maxWatchedTime, duration);

    if (newTime > video.currentTime) {
      video.currentTime = newTime;
      setCurrentTime(newTime);

      if (lesson?.lessonId && userId) {
        await progressService.updateProgressImmediate(
          userId,
          lesson.lessonId,
          Math.floor(newTime),
          false
        );
      }
    } else {
      setIsSkipModalVisible(true);
    }
  };

  const handleVolumeChange = (value) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = value / 100;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume / 100;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const handleQualityChange = (qualityIndex) => {
    if (!hlsRef.current) return;

    if (qualityIndex === -1) {
      hlsRef.current.currentLevel = -1;
      setCurrentQuality("auto");
    } else {
      hlsRef.current.currentLevel = qualityIndex;
      setCurrentQuality(qualityIndex);
    }
  };

  const handlePlaybackRateChange = (rate) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

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

  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!lesson) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
          background: "#f5f5f5",
          borderRadius: 8,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📺</div>
          <div>No lesson selected</div>
        </div>
      </div>
    );
  }

  if (!authUtils.isAuthenticated()) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
          background: "#f5f5f5",
          borderRadius: 8,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <div>Please login to watch videos</div>
        </div>
      </div>
    );
  }

  if (!progressLoaded) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
          background: "#000",
          borderRadius: 8,
          color: "white",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <LoadingOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>Loading your progress...</div>
        </div>
      </div>
    );
  }

  // Show loading or error states
  if (!dynamicVideoUrl && !videoError) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
          background: "#000",
          borderRadius: 8,
          color: "white",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <LoadingOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>Loading video for lesson {lesson.lessonId}...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (videoError) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
          background: "#000",
          borderRadius: 8,
          color: "white",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div>Video not available</div>
          <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
            {videoError}
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const watchedPercentage =
    duration > 0 ? (maxWatchedTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="modern-video-player"
      style={{
        position: "relative",
        width: "100%",
        backgroundColor: "#000",
        borderRadius: 8,
        overflow: "hidden",
        aspectRatio: "16/9",
        maxWidth: "100%",
      }}
    >
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          }
          
          .video-control-select .ant-select-selector {
            background-color: rgba(255, 255, 255, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            color: white !important;
          }
          
          .video-control-select .ant-select-selection-item {
            color: white !important;
          }
          
          .video-control-select .ant-select-arrow {
            color: white !important;
          }
          
          .video-control-select:hover .ant-select-selector {
            background-color: rgba(255, 255, 255, 0.2) !important;
            border-color: rgba(255, 255, 255, 0.5) !important;
          }

          /* Custom styles for Select dropdown options */
          .ant-select-dropdown {
            background-color: rgba(0, 0, 0, 0.9) !important;
            border: none !important;
          }

          .ant-select-item {
            color: white !important;
            background-color: transparent !important;
          }

          .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
            background-color: rgba(255, 255, 255, 0.2) !important;
            color: white !important;
          }

          .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
            background-color: rgba(255, 255, 255, 0.3) !important;
            color: white !important;
          }
        `}
      </style>

      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          cursor: "pointer",
        }}
        onClick={togglePlay}
        playsInline
        preload="metadata"
        controls={false}
        crossOrigin="anonymous"
      />

      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            zIndex: 10,
          }}
        >
          <LoadingOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>Loading video...</div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(transparent, rgba(0, 0, 0, 0.8))",
          padding: "16px 20px",
          color: "white",
          zIndex: 5,
        }}
      >
        <div style={{ marginBottom: 12, position: "relative" }}>
          <div
            style={{
              height: 6,
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              borderRadius: 3,
              position: "relative",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${watchedPercentage}%`,
                backgroundColor: "#52c41a",
                borderRadius: 3,
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />
            <div
              style={{
                height: "100%",
                width: `${progressPercentage}%`,
                backgroundColor: "#1890ff",
                borderRadius: 3,
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />
          </div>

          <Slider
            min={0}
            max={100}
            value={progressPercentage}
            onChange={handleSeek}
            tooltip={{
              formatter: (value) => {
                const time = (value / 100) * duration;
                const canSeek = time <= maxWatchedTime;
                return `${formatTime(time)} ${canSeek ? "" : "(Locked)"}`;
              },
            }}
            trackStyle={{ backgroundColor: "transparent" }}
            railStyle={{ backgroundColor: "transparent" }}
            handleStyle={{
              borderColor: "#1890ff",
              backgroundColor: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            }}
            style={{
              margin: 0,
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flex: 1,
              minWidth: 0,
            }}
          >
            <Button
              type="text"
              icon={<FastBackwardOutlined />}
              onClick={skipBackward}
              title="Tua lùi 5 giây"
              style={{
                color: "white",
                fontSize: 16,
                padding: "4px 6px",
              }}
            />

            <Button
              type="text"
              onClick={togglePlay}
              style={{
                color: "white",
                fontSize: 18,
                padding: "4px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
            </Button>

            <Button
              type="text"
              icon={<FastForwardOutlined />}
              onClick={skipForward}
              title="Tua tới 5 giây (chỉ trong vùng đã xem)"
              style={{
                color: "white",
                fontSize: 16,
                padding: "4px 6px",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 120,
              }}
            >
              <Button
                type="text"
                onClick={toggleMute}
                style={{
                  color: "white",
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isMuted ? <MutedOutlined /> : <SoundOutlined />}
              </Button>
              <Slider
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{
                  width: 70,
                  margin: 0,
                  flex: 1,
                }}
                trackStyle={{ backgroundColor: "#1890ff" }}
                railStyle={{ backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                handleStyle={{
                  borderColor: "#1890ff",
                  backgroundColor: "#fff",
                }}
              />
            </div>

            <span
              style={{
                fontSize: 13,
                color: "rgba(255, 255, 255, 0.9)",
                whiteSpace: "nowrap",
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginRight: 8,
              }}
            >
              <Progress
                type="circle"
                percent={
                  duration > 0
                    ? Math.floor((maxWatchedTime / duration) * 100)
                    : 0
                }
                size={24}
                strokeColor="rgb(221, 103, 60)"
                trailColor="rgba(255, 255, 255, 0.3)"
                strokeWidth={8}
                showInfo={false}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  color: "rgb(221, 103, 60)",
                  fontSize: 11,
                  whiteSpace: "nowrap",
                }}
              >
                <span>Watched: {formatTime(maxWatchedTime)}</span>
                <span style={{ fontWeight: "bold" }}>
                  (
                  {duration > 0
                    ? Math.floor((maxWatchedTime / duration) * 100)
                    : 0}
                  %)
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Select
              value={playbackRate}
              onChange={handlePlaybackRateChange}
              size="small"
              style={{
                width: 65,
                minWidth: 65,
              }}
              dropdownStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                color: "white",
                zIndex: 10000,
              }}
              className="video-speed-select"
              getPopupContainer={(trigger) =>
                trigger.closest(".modern-video-player") || document.body
              }
            >
              <Option key="speed-0.5" value={0.5}>
                0.5x
              </Option>
              <Option key="speed-0.75" value={0.75}>
                0.75x
              </Option>
              <Option key="speed-1" value={1}>
                1x
              </Option>
              <Option key="speed-1.25" value={1.25}>
                1.25x
              </Option>
              <Option key="speed-1.5" value={1.5}>
                1.5x
              </Option>
              <Option key="speed-2" value={2}>
                2x
              </Option>
            </Select>

            {qualities.length > 1 && (
              <Select
                value={currentQuality}
                onChange={handleQualityChange}
                size="small"
                style={{
                  width: 70,
                  minWidth: 70,
                }}
                dropdownStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  color: "white",
                  zIndex: 10000,
                }}
                className="video-quality-select"
                getPopupContainer={(trigger) =>
                  trigger.closest(".modern-video-player") || document.body
                }
              >
                {qualities.map((quality) => (
                  <Option
                    key={`quality-${quality.index}`}
                    value={quality.index}
                  >
                    {quality.label}
                  </Option>
                ))}
              </Select>
            )}

            <Button
              type="text"
              onClick={toggleFullscreen}
              style={{
                color: "white",
                padding: "4px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FullscreenOutlined />
            </Button>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "6px 12px",
          borderRadius: 4,
          fontSize: 13,
          zIndex: 5,
        }}
      >
        Lesson {lesson.lessonId}: {lesson.lessonName || "Video Lesson"}
      </div>

      {maxWatchedTime > 0 && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(82, 196, 26, 0.9)",
            color: "white",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 11,
            zIndex: 5,
          }}
        >
          Previously watched: {formatTime(maxWatchedTime)}
        </div>
      )}

      <NoskipVideoModal
        isOpen={isSkipModalVisible}
        onClose={() => setIsSkipModalVisible(false)}
      />
    </div>
  );
};

export default LMSVideoPlayer;
