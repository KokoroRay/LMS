package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.model.Lesson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for managing direct video playback from R2.
 */
@Service
@Slf4j
public class PlaybackService {
    private final S3VideoService s3VideoService;
    private final long ttlSeconds;

    public PlaybackService(S3VideoService s3VideoService) {
        this.s3VideoService = s3VideoService;
        this.ttlSeconds = 0L;
    }

    /**
     * Issues playback information for a lesson with a direct R2 URL.
     * 
     * @param userId User identifier
     * @param lesson Lesson entity containing video information
     * @return PlaybackInfo where hlsUrl contains the direct video URL for compatibility
     */
    public PlaybackInfo issuePlayback(String userId, Lesson lesson) {
        String directUrl = s3VideoService.resolvePublicUrl(lesson.getVideoUrl());
        if (directUrl == null || directUrl.isBlank()) {
            throw new IllegalStateException("No video available for this lesson");
        }

        log.info("Resolved direct R2 playback for lesson {} and user {}", lesson.getLessonId(), userId);
        return new PlaybackInfo(directUrl, null, null, ttlSeconds, null);
    }

    /**
     * Playback information record containing all necessary URLs and metadata
     */
    public record PlaybackInfo(
        String hlsUrl,
        String dashUrl,
        String cookieSetterUrl,
        long ttlSeconds,
        String jwtToken
    ) {}
}