import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button, Slider, Select, message } from "antd";
import {
  PlayCircleOutlined,
  PauseOutlined,
  SoundOutlined,
  MutedOutlined,
  FullscreenOutlined,
  BackwardOutlined,
  ForwardOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import Hls from "hls.js";
import "./VideoPlayerStyles.css";

const { Option } = Select;

const VIDEO_MAP = {
  31: "e1b29e9e-95a8-4c93-98ac-b6abfce54aad",
  32: "c0f317b9-4cbb-4d19-b27c-3dbc0a18d0f8",
};

const VideoPlayerCloudFront = ({ lesson }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const progressUpdateRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState("auto");
  const [hlsLoaded, setHlsLoaded] = useState(false);

  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [watchedSegments, setWatchedSegments] = useState(new Set());
  const [watchedTime, setWatchedTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const getVideoUrl = useCallback(
    (lessonId) => {
      const videoId = VIDEO_MAP[lessonId];
      if (!videoId) return null;
      const courseId = lesson?.courseId || 3;
      return `https://d1ybhieu7adt5b.cloudfront.net/vod/hls/${courseId}_${lessonId}/${videoId}.m3u8`;
    },
    [lesson?.courseId]
  );

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
        xhrSetup: (xhr) => {},
      });

      hlsRef.current = hls;

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsLoading(false);
        setHlsLoaded(true);

        const levels = data.levels.map((level, index) => ({
          index,
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
          label: `${level.height}p`,
        }));

        setQualities([{ index: -1, label: "Auto" }, ...levels]);
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
      setIsLoading(false);
      setHlsLoaded(true);
    } else {
      message.error("HLS video playback not supported in this browser");
    }
  }, []);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      const now = video.currentTime;
      setCurrentTime(now);

      if (now > maxWatchedTime) {
        setMaxWatchedTime(now);
        const segment = Math.floor(now / 10);
        setWatchedSegments((prev) => new Set(prev).add(segment));
        setWatchedTime((prev) => Math.max(prev, now));

        if (video.duration > 0 && now / video.duration >= 0.95) {
          if (!isCompleted) {
            setIsCompleted(true);
            message.success(`Lesson ${lesson?.lessonId} completed!`);
          }
        }
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [maxWatchedTime, isCompleted, lesson?.lessonId]);

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
      if (error.name === "NotAllowedError") {
        message.warning("Click the video to enable playback");
      }
    }
  };

  const handleProgressClick = (value) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const targetTime = (value / 100) * duration;
    const allowedTime = Math.min(maxWatchedTime + 30, duration);

    if (targetTime > allowedTime) {
      message.warning(
        `You can only seek up to ${Math.floor(allowedTime / 60)}:${String(
          Math.floor(allowedTime % 60)
        ).padStart(2, "0")}. Watch more to unlock further content.`
      );
      return;
    }

    video.currentTime = targetTime;
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;

    const targetTime = video.currentTime + 10;
    const allowedTime = Math.min(maxWatchedTime + 30, duration);

    if (targetTime > allowedTime) {
      message.warning("You cannot skip ahead beyond your watched progress");
      return;
    }

    video.currentTime = Math.min(duration, targetTime);
  };

  const handleVolumeChange = (value) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value / 100;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

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

  const handleMouseMove = () => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!videoRef.current) return;
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "PageUp",
          "PageDown",
          "Home",
          "End",
        ].includes(e.code)
      ) {
        e.preventDefault();
        message.warning(
          "Keyboard seeking is disabled to prevent skipping ahead"
        );
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (progressUpdateRef.current) {
        clearInterval(progressUpdateRef.current);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!lesson) {
    return (
      <div className="video-player-container">
        <div className="video-placeholder">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📺</div>
          <div>No lesson selected</div>
        </div>
      </div>
    );
  }

  const videoUrl = getVideoUrl(lesson.lessonId);

  if (!videoUrl) {
    return (
      <div className="video-player-container">
        <div className="video-placeholder">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <div>Video not available for lesson {lesson.lessonId}</div>
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
      className={`modern-video-player video-player-container ${
        isFullscreen ? "fullscreen" : ""
      }`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="video-element"
        onClick={togglePlay}
        playsInline
        preload="metadata"
      />

      {(isLoading || isBuffering) && (
        <div className="loading-overlay">
          <LoadingOutlined style={{ fontSize: 48, color: "white" }} />
          <div style={{ marginTop: 16, color: "white" }}>
            {isLoading ? "Loading video..." : "Buffering..."}
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="completion-badge">
          <CheckCircleOutlined />
          <span>Completed</span>
        </div>
      )}

      <div className={`video-controls ${showControls ? "visible" : "hidden"}`}>
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-watched"
              style={{ width: `${watchedPercentage}%` }}
            />
            <div
              className="progress-current"
              style={{ width: `${progressPercentage}%` }}
            />
            <div
              className="progress-clickable"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = ((e.clientX - rect.left) / rect.width) * 100;
                handleProgressClick(percent);
              }}
            />
          </div>
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <Button
              type="text"
              icon={<BackwardOutlined />}
              onClick={skipBackward}
              className="control-button"
              title="Skip back 10s"
            />

            <Button
              type="text"
              icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
              onClick={togglePlay}
              className="control-button play-button"
              size="large"
            />

            <Button
              type="text"
              icon={<ForwardOutlined />}
              onClick={skipForward}
              className="control-button"
              title="Skip forward 10s"
            />

            <div className="volume-control">
              <Button
                type="text"
                icon={isMuted ? <MutedOutlined /> : <SoundOutlined />}
                onClick={toggleMute}
                className="control-button"
              />
              <Slider
                min={0}
                max={100}
                value={isMuted ? 0 : volume * 100}
                onChange={handleVolumeChange}
                style={{ width: 80, margin: "0 8px" }}
              />
            </div>

            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="controls-right">
            <Select
              value={playbackRate}
              onChange={handlePlaybackRateChange}
              className="video-speed-select"
              size="small"
              getPopupContainer={(trigger) =>
                trigger.closest(".modern-video-player") || document.body
              }
            >
              <Option value={0.5}>0.5x</Option>
              <Option value={0.75}>0.75x</Option>
              <Option value={1}>1x</Option>
              <Option value={1.25}>1.25x</Option>
              <Option value={1.5}>1.5x</Option>
              <Option value={2}>2x</Option>
            </Select>

            {qualities.length > 1 && (
              <Select
                value={currentQuality}
                onChange={handleQualityChange}
                className="video-quality-select"
                size="small"
                getPopupContainer={(trigger) =>
                  trigger.closest(".modern-video-player") || document.body
                }
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
              className="control-button"
            />
          </div>
        </div>
      </div>

      <div className="lesson-info">
        <div>
          Lesson {lesson.lessonId}: {lesson.lessonName || "Video Lesson"}
        </div>
        {isCompleted && (
          <CheckCircleOutlined style={{ color: "#52c41a", marginLeft: 8 }} />
        )}
      </div>
    </div>
  );
};

export default VideoPlayerCloudFront;
