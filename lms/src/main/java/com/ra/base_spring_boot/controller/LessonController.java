    package com.ra.base_spring_boot.controller;

    import com.fasterxml.jackson.databind.ObjectMapper;
    import com.ra.base_spring_boot.dto.req.LessonRequestDTO;
    import com.ra.base_spring_boot.dto.resp.LessonDTO;
    import com.ra.base_spring_boot.dto.resp.SessionWithLessonsDTO;
    import com.ra.base_spring_boot.services.ILessonService;
    import com.ra.base_spring_boot.services.PlaybackService;
    import com.ra.base_spring_boot.services.impl.LessonServiceImpl;
    import com.ra.base_spring_boot.model.Lesson;
    import lombok.RequiredArgsConstructor;
    import lombok.extern.slf4j.Slf4j;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;
    import org.springframework.web.multipart.MultipartFile;

    import jakarta.servlet.http.HttpServletRequest;
    import org.springframework.security.core.Authentication;
    import lombok.extern.slf4j.Slf4j;
    import java.io.IOException;
    import java.util.Collections;
    import java.util.HashMap;
    import java.util.List;
    import java.util.Map;

    @Slf4j
    @RestController
    @RequestMapping("/lessons")
    @RequiredArgsConstructor
    public class LessonController {

        private final ILessonService lessonService;
        private final LessonServiceImpl lessonServiceImpl; // For accessing additional methods
        private final PlaybackService playbackService; // Direct R2 playback service
        private final ObjectMapper objectMapper = new ObjectMapper(); // Dùng chung cho parse JSON

        // ------------------- GET -------------------
        @GetMapping("/session/{sessionId}")
        public ResponseEntity<List<LessonDTO>> getLessonsBySession(@PathVariable Integer sessionId) {
            List<LessonDTO> lessons = lessonService.getCourseStructure(sessionId);
            return ResponseEntity.ok(lessons);
        }

        @GetMapping("/course/{courseId}/structure")
        public ResponseEntity<List<SessionWithLessonsDTO>> getCourseStructure(@PathVariable Integer courseId) {
            List<SessionWithLessonsDTO> structure = lessonService.getCourseStructureWithSessions(courseId);
            return ResponseEntity.ok(structure);
        }

        // ------------------- CREATE -------------------

        // Create lesson with video URL (JSON) - supports Cloudinary URLs
        @PostMapping(consumes = "application/json")
        public ResponseEntity<?> createLessonJson(@RequestBody LessonRequestDTO dto) {
            try {
                // Keep video URL if provided (for Cloudinary integration)
                // dto.setVideoUrl(null); // Remove this line to allow video URLs

                LessonDTO createdLesson = lessonService.createLesson(dto);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Lesson created successfully",
                        "lesson", createdLesson
                ));

            } catch (RuntimeException e) {
                return ResponseEntity.status(400)
                        .body(Map.of(
                                "success", false,
                                "message", e.getMessage()
                        ));
            }
        }

        // Create lesson with optional video (multipart/form-data)
        @PostMapping(consumes = "multipart/form-data")
        public ResponseEntity<?> createLessonWithVideo(
                @RequestPart("lesson") String lessonJson,
                @RequestPart(value = "video", required = false) MultipartFile videoFile,
                HttpServletRequest request
        ) {
            try {
                // Parse JSON string -> LessonRequestDTO
                LessonRequestDTO dto = objectMapper.readValue(lessonJson, LessonRequestDTO.class);

                // Validate video file if provided
                if (videoFile != null && !videoFile.isEmpty()) {
                    validateVideoFile(videoFile);
                    dto.setVideoUrl(videoFile);
                }

                LessonDTO createdLesson = lessonService.createLesson(dto);

                // Return success response with lesson data
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Lesson created successfully" + (videoFile != null ? " with video" : ""),
                        "lesson", createdLesson
                ));

            } catch (IOException e) {
                e.printStackTrace();
                return ResponseEntity.status(500)
                        .body(Map.of(
                                "success", false,
                                "message", "JSON parse error: " + e.getMessage()
                        ));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(400)
                        .body(Map.of(
                                "success", false,
                                "message", "Invalid video file: " + e.getMessage()
                        ));
            } catch (RuntimeException e) {
                e.printStackTrace();
                return ResponseEntity.status(400)
                        .body(Map.of(
                                "success", false,
                                "message", e.getMessage()
                        ));
            }
        }

        // ------------------- UPDATE -------------------

        // Update lesson without video (JSON)
        @PutMapping(value = "/{lessonId}", consumes = "application/json")
        public ResponseEntity<?> updateLessonJson(
                @PathVariable Integer lessonId,
                @RequestBody LessonRequestDTO dto
        ) {
            try {
                // Ensure no video file is set when using JSON
                dto.setVideoUrl(null);

                LessonDTO updatedLesson = lessonService.updateLesson(lessonId, dto);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Lesson updated successfully",
                        "lesson", updatedLesson
                ));

            } catch (RuntimeException e) {
                return ResponseEntity.status(400)
                        .body(Map.of(
                                "success", false,
                                "message", e.getMessage()
                        ));
            }
        }

        // Update lesson with optional video (multipart/form-data)
        @PutMapping(value = "/{lessonId}", consumes = "multipart/form-data")
        public ResponseEntity<?> updateLessonWithVideo(
                @PathVariable Integer lessonId,
                @RequestPart("lesson") String lessonJson,
                @RequestPart(value = "video", required = false) MultipartFile videoFile
        ) {
            try {
                // Parse JSON
                LessonRequestDTO dto = objectMapper.readValue(lessonJson, LessonRequestDTO.class);

                // Validate video file if provided
                if (videoFile != null && !videoFile.isEmpty()) {
                    validateVideoFile(videoFile);
                    dto.setVideoUrl(videoFile);
                }

                LessonDTO updatedLesson = lessonService.updateLesson(lessonId, dto);

                // Return success response
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Lesson updated successfully" + (videoFile != null ? " with new video" : ""),
                        "lesson", updatedLesson
                ));

            } catch (IOException e) {
                return ResponseEntity.status(500)
                        .body(Map.of(
                                "success", false,
                                "message", "JSON parse error: " + e.getMessage()
                        ));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(400)
                        .body(Map.of(
                                "success", false,
                                "message", "Invalid video file: " + e.getMessage()
                        ));
            } catch (RuntimeException e) {
                return ResponseEntity.status(400)
                        .body(Map.of(
                                "success", false,
                                "message", e.getMessage()
                        ));
            }
        }

        // ------------------- HELPER METHODS -------------------
        private void validateVideoFile(MultipartFile videoFile) {
            // Check file size (max 3GB)
            long maxSize = 3L * 1024 * 1024 * 1024; // 3GB
            if (videoFile.getSize() > maxSize) {
                throw new IllegalArgumentException("Video file size exceeds maximum limit of 3GB");
            }

            // Check content type
            String contentType = videoFile.getContentType();
            if (contentType == null || !contentType.startsWith("video/")) {
                throw new IllegalArgumentException("File must be a video");
            }

            // Check allowed video formats - comprehensive list of popular video formats
            String[] allowedTypes = {
                "video/mp4",           // MP4
                "video/avi",           // AVI
                "video/mov",           // MOV/QuickTime
                "video/wmv",           // WMV
                "video/flv",           // FLV
                "video/webm",          // WebM
                "video/x-matroska",    // MKV
                "video/x-msvideo",     // AVI alternative
                "video/quicktime",     // MOV alternative
                "video/x-ms-wmv",      // WMV alternative
                "video/3gpp",          // 3GP
                "video/x-flv",         // FLV alternative
                "video/ogg",           // OGV
                "video/mp2t",          // TS (Transport Stream)
                "video/x-m4v"          // M4V
            };
            boolean isValidType = false;
            for (String allowedType : allowedTypes) {
                if (allowedType.equals(contentType)) {
                    isValidType = true;
                    break;
                }
            }

            if (!isValidType) {
                throw new IllegalArgumentException("Unsupported video format: " + contentType + 
                    ". Allowed formats: MP4, AVI, MOV, WMV, FLV, WebM, MKV, 3GP, OGV, TS, M4V");
            }

            // Check file extension
            String originalFileName = videoFile.getOriginalFilename();
            if (originalFileName == null || !originalFileName.contains(".")) {
                throw new IllegalArgumentException("Video file must have a valid extension");
            }
        }

        // ------------------- GET BY ID -------------------
        @GetMapping("/{lessonId}")
        public ResponseEntity<LessonDTO> getLessonById(@PathVariable Integer lessonId) {
            LessonDTO lesson = lessonService.findById(lessonId);
            return ResponseEntity.ok(lesson);
        }

        // ------------------- DELETE -------------------
        @DeleteMapping("/{lessonId}")
        public ResponseEntity<Void> deleteLesson(@PathVariable Integer lessonId) {
            lessonService.deleteLesson(lessonId);
            return ResponseEntity.noContent().build();
        }

        @GetMapping("/{lessonId}/video/stream")
        public ResponseEntity<?> getVideoStreamingUrl(@PathVariable Integer lessonId, Authentication authentication, HttpServletRequest request) {
            try {
                // Enhanced security checks
                if (authentication == null || !authentication.isAuthenticated()) {
                    return ResponseEntity.status(401)
                            .body(Map.of("message", "Authentication required to access video content"));
                }

                String username = authentication.getName();
                String clientIp = getClientIpAddress(request);
                
                // Rate limiting check (simple implementation)
                if (isRateLimited(username, clientIp)) {
                    return ResponseEntity.status(429)
                            .body(Map.of("message", "Too many requests. Please try again later."));
                }

                // Get lesson with additional security validation
                LessonDTO lesson = lessonService.findById(lessonId);

                if (lesson.getVideoUrl() == null || lesson.getVideoUrl().isEmpty()) {
                    return ResponseEntity.ok(Map.of("message", "No video available for this lesson"));
                }

                // TODO: Add course enrollment check
                // if (!hasAccessToLesson(authentication, lessonId)) {
                //     return ResponseEntity.status(403)
                //             .body(Map.of("message", "You don't have access to this lesson"));
                // }

                // Enhanced audit logging
                log.info("VIDEO_ACCESS: User '{}' (IP: {}) accessing lesson {} at {}", 
                        username, clientIp, lessonId, java.time.Instant.now());

                // Generate direct R2 playback URL using PlaybackService
                String userId = getUserIdFromAuthentication(authentication);
                Lesson lessonEntity = convertToLessonEntity(lesson);
                
                try {
                    PlaybackService.PlaybackInfo playbackInfo = playbackService.issuePlayback(userId, lessonEntity);
                    
                    String directUrl = playbackInfo.hlsUrl();
                    
                    // Record access for analytics and security monitoring
                    recordVideoAccess(username, lessonId, clientIp);

                    return ResponseEntity.ok(Map.of(
                            "lessonId", lessonId,
                        "videoUrl", directUrl,
                        "playbackType", "R2_DIRECT",
                        "expiresIn", "0 seconds",
                            "accessedBy", username,
                            "accessTime", java.time.Instant.now().toString(),
                            "clientIp", clientIp,
                        "videoType", "R2_DIRECT"
                    ));
                    
                } catch (Exception e) {
                        log.error("Error generating direct R2 playback for lesson {}: {}", lessonId, e.getMessage(), e);
                    
                    // Return error response instead of fallback
                    return ResponseEntity.status(500).body(Map.of(
                            "lessonId", lessonId,
                            "error", "Direct playback generation failed: " + e.getMessage(),
                            "videoType", "ERROR",
                            "message", "Video playback is temporarily unavailable",
                            "accessedBy", username,
                            "accessTime", java.time.Instant.now().toString()
                    ));
                }

            } catch (RuntimeException e) {
                return ResponseEntity.status(404)
                        .body(Map.of("message", e.getMessage()));
            }
        }

        @PostMapping("/{lessonId}/video/refresh-url")
        public ResponseEntity<?> refreshVideoUrl(@PathVariable Integer lessonId, Authentication authentication, HttpServletRequest request) {
            try {
                // Enhanced security checks
                if (authentication == null || !authentication.isAuthenticated()) {
                    return ResponseEntity.status(401)
                            .body(Map.of("message", "Authentication required to refresh video URL"));
                }

                String username = authentication.getName();
                String clientIp = getClientIpAddress(request);

                // Rate limiting for URL refresh (more restrictive)
                if (isRateLimited(username + ":refresh", clientIp)) {
                    return ResponseEntity.status(429)
                            .body(Map.of("message", "Too many refresh requests. Please wait before trying again."));
                }

                // Get lesson with validation
                LessonDTO lesson = lessonService.findById(lessonId);

                if (lesson.getVideoUrl() == null || lesson.getVideoUrl().isEmpty()) {
                    return ResponseEntity.ok(Map.of("message", "No video available for this lesson"));
                }

                // Log refresh attempt for security monitoring
                log.info("VIDEO_URL_REFRESH: User '{}' (IP: {}) refreshing URL for lesson {} at {}", 
                        username, clientIp, lessonId, java.time.Instant.now());

                // Generate a fresh direct R2 playback URL
                String userId = getUserIdFromAuthentication(authentication);
                Lesson lessonEntity = convertToLessonEntity(lesson);
                
                try {
                    PlaybackService.PlaybackInfo playbackInfo = playbackService.issuePlayback(userId, lessonEntity);
                    
                    String newDirectUrl = playbackInfo.hlsUrl();

                    return ResponseEntity.ok(Map.of(
                            "lessonId", lessonId,
                        "newVideoUrl", newDirectUrl,
                        "playbackType", "R2_DIRECT",
                        "expiresIn", "0 seconds",
                        "message", "R2 video URL refreshed successfully",
                            "refreshedBy", username,
                            "refreshTime", java.time.Instant.now().toString(),
                        "videoType", "R2_DIRECT"
                    ));
                    
                } catch (Exception e) {
                    log.error("Error refreshing direct R2 URL for lesson {}: {}", lessonId, e.getMessage(), e);
                    
                    // Return error response
                    return ResponseEntity.status(500).body(Map.of(
                            "lessonId", lessonId,
                        "error", "Direct playback refresh failed: " + e.getMessage(),
                            "videoType", "ERROR",
                        "message", "Unable to refresh video URL",
                            "refreshedBy", username,
                            "refreshTime", java.time.Instant.now().toString()
                    ));
                }

            } catch (RuntimeException e) {
                log.error("Error refreshing video URL for lesson {}: {}", lessonId, e.getMessage());
                return ResponseEntity.status(404)
                        .body(Map.of("message", e.getMessage()));
            }
        }

        /**
         * 🎬 ANONYMOUS VIDEO STREAMING - No Authentication Required
         * This endpoint allows access to video streaming without authentication
         * Use this for development/testing or when frontend can't authenticate
         */
        @GetMapping("/{lessonId}/video/stream-anonymous")
        public ResponseEntity<?> getVideoStreamingUrlAnonymous(@PathVariable Integer lessonId, HttpServletRequest request) {
            try {
                String clientIp = getClientIpAddress(request);
                
                log.info("ANONYMOUS_VIDEO_ACCESS: IP {} accessing lesson {} at {}", 
                        clientIp, lessonId, java.time.Instant.now());

                // Get lesson without authentication check
                LessonDTO lesson = lessonService.findById(lessonId);

                if (lesson.getVideoUrl() == null || lesson.getVideoUrl().isEmpty()) {
                    return ResponseEntity.ok(Map.of(
                        "message", "No video available for this lesson",
                        "lessonId", lessonId,
                        "status", "no_video"
                    ));
                }

                // Generate direct R2 playback URL using PlaybackService
                Lesson lessonEntity = convertToLessonEntity(lesson);
                
                try {
                    // Use anonymous user for playback
                    PlaybackService.PlaybackInfo playbackInfo = playbackService.issuePlayback("anonymous-" + clientIp, lessonEntity);

                    String directUrl = playbackInfo.hlsUrl();

                    return ResponseEntity.ok(Map.of(
                            "lessonId", lessonId,
                        "videoUrl", directUrl,
                        "playbackType", "R2_DIRECT",
                        "expiresIn", "0 seconds",
                            "accessedBy", "anonymous",
                            "accessTime", java.time.Instant.now().toString(),
                            "clientIp", clientIp,
                        "videoType", "R2_DIRECT",
                            "status", "success",
                        "note", "Anonymous direct video access - no authentication required"
                    ));
                    
                } catch (Exception e) {
                    log.error("Error generating anonymous direct R2 playback for lesson {}: {}", lessonId, e.getMessage(), e);
                    
                    // Return detailed error for debugging
                    return ResponseEntity.status(500).body(Map.of(
                            "lessonId", lessonId,
                        "error", "Anonymous direct playback generation failed: " + e.getMessage(),
                            "videoType", "ERROR",
                        "message", "Video playback is temporarily unavailable",
                            "accessedBy", "anonymous",
                            "accessTime", java.time.Instant.now().toString(),
                            "clientIp", clientIp,
                            "status", "error"
                    ));
                }

            } catch (RuntimeException e) {
                log.error("Error in anonymous video access for lesson {}: {}", lessonId, e.getMessage());
                return ResponseEntity.status(404)
                        .body(Map.of(
                            "message", e.getMessage(),
                            "lessonId", lessonId,
                            "status", "not_found"
                        ));
            }
        }

        /**
         * Endpoint for direct R2 video playback.
         */
        @PostMapping("/{id}/play-advanced")
        public ResponseEntity<?> play(@PathVariable Long id, Authentication authentication) {
            try {
                // 1) Authentication & Authorization check
                if (authentication == null || !authentication.isAuthenticated()) {
                    return ResponseEntity.status(401)
                            .body(Map.of("message", "Authentication required"));
                }

                String userId = getUserIdFromAuthentication(authentication);
                
                // Get lesson and validate access
                LessonDTO lessonDTO = lessonService.findById(id.intValue());
                
                // Convert DTO to entity (needed for PlaybackService)
                Lesson lesson = convertToLessonEntity(lessonDTO);

                // Additional authorization check (course enrollment, etc.)
                if (!hasAccessToLesson(authentication, id.intValue())) {
                    return ResponseEntity.status(403)
                            .body(Map.of("message", "Access denied to this lesson"));
                }

                // 2) Generate playback information for direct R2 playback
                PlaybackService.PlaybackInfo info = playbackService.issuePlayback(userId, lesson);

                // 3) Generate response for direct playback
                Map<String, Object> directPlayback = generateAdaptiveStreamingUrls(lesson, info);

                log.info("R2_PLAYBACK_ISSUED: User '{}' accessing lesson {} via direct playback", 
                        userId, id);

                // 4) Return comprehensive playback information
                Map<String, Object> response = new HashMap<>();
                response.put("lessonId", id);
                response.put("videoUrl", info.hlsUrl());
                response.put("playbackType", "R2_DIRECT");
                response.put("ttlSeconds", 0);
                response.put("adaptiveStreaming", directPlayback);
                response.put("message", "Direct R2 playback ready.");
                
                return ResponseEntity.ok(response);

            } catch (IllegalStateException e) {
                return ResponseEntity.status(409)
                        .body(Map.of("message", e.getMessage()));
            } catch (Exception e) {
                log.error("Error generating playback info for lesson {}: {}", id, e.getMessage());
                return ResponseEntity.status(500)
                        .body(Map.of("message", "Failed to generate playback information"));
            }
        }

        /**
         * Refresh direct R2 playback information for extended viewing sessions.
         */
        @PostMapping("/{id}/play/refresh")
        public ResponseEntity<?> refreshPlayback(@PathVariable Long id, Authentication authentication) {
            try {
                // Authentication check
                if (authentication == null || !authentication.isAuthenticated()) {
                    return ResponseEntity.status(401)
                            .body(Map.of("message", "Authentication required"));
                }

                String userId = getUserIdFromAuthentication(authentication);

                // Get lesson and validate access  
                LessonDTO lessonDTO = lessonService.findById(id.intValue());
                Lesson lesson = convertToLessonEntity(lessonDTO);

                // Authorization check
                if (!hasAccessToLesson(authentication, id.intValue())) {
                    return ResponseEntity.status(403)
                            .body(Map.of("message", "Access denied to this lesson"));
                }

                // Generate a fresh direct R2 playback URL
                PlaybackService.PlaybackInfo info = playbackService.issuePlayback(userId, lesson);

                log.info("R2_PLAYBACK_REFRESHED: User '{}' refreshed playback for lesson {}", 
                        userId, id);

                return ResponseEntity.ok(Map.of(
                        "lessonId", id,
                    "videoUrl", info.hlsUrl(),
                    "playbackType", "R2_DIRECT",
                    "ttlSeconds", 0,
                    "message", "Direct playback refreshed successfully."
                ));

            } catch (Exception e) {
                log.error("Error refreshing playback token for lesson {}: {}", id, e.getMessage());
                return ResponseEntity.status(500)
                        .body(Map.of("message", "Failed to refresh playback token"));
            }
        }

        // Security utility methods
        private String getClientIpAddress(HttpServletRequest request) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp;
            }
            
            return request.getRemoteAddr();
        }

        private boolean isRateLimited(String username, String clientIp) {
            // Simple rate limiting implementation
            // In production, use Redis or proper rate limiting library
            String key = username + ":" + clientIp;
            long currentTime = System.currentTimeMillis();
            
            // Allow max 10 video requests per hour per user/IP
            // This is a basic implementation - use proper rate limiting in production
            return false; // Disabled for now, implement with Redis/Cache
        }

        private void recordVideoAccess(String username, Integer lessonId, String clientIp) {
            // Record access for analytics and security monitoring
            // In production, send to analytics service or security monitoring system
        }

        private boolean hasAccessToLesson(org.springframework.security.core.Authentication authentication, Integer lessonId) {
            // TODO: Implement course enrollment check
            // 1. Get lesson's course ID
            // 2. Check if user is enrolled in that course
            // 3. Check if course is active and user has valid enrollment
            // 4. Check if lesson is unlocked for user's progress level
            
            // For now, return true (allow access)
            // In production, implement proper enrollment validation
            return true;
        }

        private String extractVideoPathForDirectPlayback(String videoUrl) {
            // Legacy helper kept for compatibility with older code paths.
            try {
                if (videoUrl == null || videoUrl.isBlank()) {
                    return "";
                }

                if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
                    String[] parts = videoUrl.split("/");
                    String fileName = parts[parts.length - 1];
                    int dotIndex = fileName.lastIndexOf('.');
                    String baseName = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
                    return "uploads/" + baseName + "/";
                }
                return videoUrl;
            } catch (Exception e) {
                log.warn("Error extracting video path from URL: {}", videoUrl);
                return videoUrl;
            }
        }

        private String getUserIdFromAuthentication(org.springframework.security.core.Authentication authentication) {
            // Extract user ID from JWT or UserDetails
            if (authentication.getPrincipal() instanceof com.ra.base_spring_boot.security.principle.MyUserDetails) {
                com.ra.base_spring_boot.security.principle.MyUserDetails userDetails = 
                    (com.ra.base_spring_boot.security.principle.MyUserDetails) authentication.getPrincipal();
                return userDetails.getUser().getId().toString();
            }
            return authentication.getName(); // Fallback to username
        }

        /**
         * Generate direct playback URLs for compatibility with the old response shape.
         */
        private Map<String, Object> generateAdaptiveStreamingUrls(Lesson lesson, PlaybackService.PlaybackInfo info) {
            Map<String, Object> streamingInfo = new HashMap<>();

            streamingInfo.put("directUrl", info.hlsUrl());
            streamingInfo.put("adaptiveEnabled", false);
            streamingInfo.put("videoType", "R2_DIRECT");
            streamingInfo.put("resolution", "original");
            
            return streamingInfo;
        }

        /**
         * Generate a stable object prefix for the original upload.
         */
        private String generateVideoPath(Lesson lesson) {
            String courseId = lesson.getCourse() != null ? 
                lesson.getCourse().getCourseId().toString() : "default";
            String lessonId = lesson.getLessonId().toString();
            
            return String.format("uploads/%s/%s", courseId, lessonId);
        }



        /**
         * Get available resolutions for a specific lesson
         */
        @GetMapping("/{lessonId}/resolutions")
        public ResponseEntity<?> getAvailableResolutions(@PathVariable Integer lessonId, Authentication authentication) {
            try {
                if (authentication == null || !authentication.isAuthenticated()) {
                    return ResponseEntity.status(401)
                            .body(Map.of("message", "Authentication required"));
                }

                // Check access permission
                if (!hasAccessToLesson(authentication, lessonId)) {
                    return ResponseEntity.status(403)
                            .body(Map.of("message", "Access denied to this lesson"));
                }

                LessonDTO lessonDTO = lessonService.findById(lessonId);
                Lesson lesson = convertToLessonEntity(lessonDTO);

                // Direct playback does not support resolution switching in the backend.
                Map<String, Object> resolutions = new HashMap<>();
                
                resolutions.put("original", Map.of(
                    "label", "Original file",
                    "available", true,
                    "directUrl", playbackService.issuePlayback(getUserIdFromAuthentication(authentication), lesson).hlsUrl()
                ));

                return ResponseEntity.ok(Map.of(
                    "lessonId", lessonId,
                    "resolutions", resolutions,
                    "defaultResolution", "original",
                    "adaptiveEnabled", false
                ));

            } catch (Exception e) {
                log.error("Error getting resolutions for lesson {}: {}", lessonId, e.getMessage());
                return ResponseEntity.status(500)
                        .body(Map.of("message", "Failed to get resolution information"));
            }
        }

        /**
         * Switch to specific resolution during playback
         */
        @PostMapping("/{lessonId}/resolution/{resolution}")
        public ResponseEntity<?> switchResolution(@PathVariable Integer lessonId, 
                                                 @PathVariable String resolution, 
                                                 Authentication authentication) {
            try {
                if (authentication == null || !authentication.isAuthenticated()) {
                    return ResponseEntity.status(401)
                            .body(Map.of("message", "Authentication required"));
                }

                if (!hasAccessToLesson(authentication, lessonId)) {
                    return ResponseEntity.status(403)
                            .body(Map.of("message", "Access denied to this lesson"));
                }

                // Validate resolution
                if (!"original".equalsIgnoreCase(resolution)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Direct R2 playback only supports the original file"));
                }

                LessonDTO lessonDTO = lessonService.findById(lessonId);
                Lesson lesson = convertToLessonEntity(lessonDTO);
                String userId = getUserIdFromAuthentication(authentication);

                // Generate direct playback info
                PlaybackService.PlaybackInfo info = playbackService.issuePlayback(userId, lesson);

                Map<String, Object> resolutionInfo = Map.of(
                    "resolution", "original",
                    "directUrl", info.hlsUrl(),
                    "ttlSeconds", 0
                );

                log.info("R2_DIRECT_SWITCH: User '{}' switched playback for lesson {}", 
                        userId, lessonId);

                return ResponseEntity.ok(Map.of(
                    "lessonId", lessonId,
                    "currentResolution", "original",
                    "streamingInfo", resolutionInfo,
                    "message", "Direct playback uses the original file only"
                ));

            } catch (Exception e) {
                log.error("Error switching resolution for lesson {}: {}", lessonId, e.getMessage());
                return ResponseEntity.status(500)
                        .body(Map.of("message", "Failed to switch resolution"));
            }
        }

        /**
         * Convert LessonDTO to Lesson entity for PlaybackService
         * This is a temporary helper method - consider using proper mapping service
         */
        private Lesson convertToLessonEntity(LessonDTO dto) {
            Lesson lesson = new Lesson();
            lesson.setLessonId(dto.getLessonId());
            lesson.setTitle(dto.getTitle());
            lesson.setVideoUrl(dto.getVideoUrl());
            lesson.setDescription(dto.getDescription());
            lesson.setContent(dto.getContent());
            lesson.setDurationMinutes(dto.getDurationMinutes());
            lesson.setOrderIndex(dto.getOrderIndex());
            lesson.setQuizId(dto.getQuizId());
            lesson.setQuizDurationMinutes(dto.getQuizDurationMinutes());
            
            // Set course if available (needed for path generation)
            if (dto.getCourseId() != null) {
                com.ra.base_spring_boot.model.Course course = new com.ra.base_spring_boot.model.Course();
                course.setCourseId(dto.getCourseId());
                lesson.setCourse(course);
            }
            
            return lesson;
        }

        // Public video playback endpoint
        @PostMapping("/{lessonId}/video/public-playback")
        public ResponseEntity<?> getPublicVideoPlayback(@PathVariable Integer lessonId) {
            try {
                LessonDTO lessonDTO = lessonService.findById(lessonId);
                Lesson lesson = convertToLessonEntity(lessonDTO);
                PlaybackService.PlaybackInfo playbackInfo = playbackService.issuePlayback("public_user", lesson);

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("lessonId", lessonId);
                responseBody.put("lessonTitle", lessonDTO.getTitle());
                responseBody.put("videoUrl", playbackInfo.hlsUrl());
                responseBody.put("playbackType", "R2_DIRECT");
                responseBody.put("expiresIn", "0 seconds");
                responseBody.put("status", "success");

                return ResponseEntity.ok(responseBody);

            } catch (Exception e) {
                log.error("Failed to generate video playback for lesson {}: {}", lessonId, e.getMessage());
                return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", "Video playback generation failed: " + e.getMessage(),
                    "lessonId", lessonId,
                    "streamingUrl", null,
                    "cookieSetterUrl", null
                ));
            }
        }
    }
