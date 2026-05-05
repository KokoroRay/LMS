package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.services.S3VideoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/video/upload")
@RequiredArgsConstructor
@Slf4j
public class VideoUploadController {

    private final S3VideoService s3VideoService;

    @PostMapping("/upload-url")
    public ResponseEntity<Map<String, String>> generateUploadUrl(
            @RequestParam String fileName,
            @RequestParam String contentType,
            @RequestParam String courseId,  // 🎯 FIX: Thêm courseId
            @RequestParam String lessonId,  // 🎯 FIX: Thêm lessonId
            @RequestParam(defaultValue = "2") int expirationHours) {
                
        try {
            if (contentType == null || !contentType.startsWith("video/")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid content type",
                    "message", "Content type must be a video format"
                ));
            }
            
            // 🎯 FIX: Sử dụng courseId và lessonId thật từ frontend
            S3VideoService.PreSignedUploadInfo uploadInfo = s3VideoService.generatePreSignedUploadUrl(
                    courseId, lessonId, fileName, contentType, expirationHours * 60);
                        
            return ResponseEntity.ok(Map.of(
                "uploadUrl", uploadInfo.uploadUrl(),
                "videoKey", uploadInfo.s3Key(),
                "courseId", courseId,  // 🎯 FIX: Trả về courseId
                "lessonId", lessonId,  // 🎯 FIX: Trả về lessonId
                "expirationHours", String.valueOf(expirationHours)
            ));
        } catch (Exception e) {
            log.error("Failed to generate pre-signed upload URL for file: {}", fileName, e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Failed to generate upload URL",
                "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{videoKey}")
    public ResponseEntity<Map<String, String>> deleteVideo(@PathVariable String videoKey) {
        try {
            s3VideoService.deleteVideo(videoKey);
                        
            return ResponseEntity.ok(Map.of(
                "videoKey", videoKey,
                "status", "deleted"
            ));
        } catch (Exception e) {
            log.error("Failed to delete video: {}", videoKey, e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Failed to delete video",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/bucket-info")
    public ResponseEntity<Map<String, Object>> getBucketInfo() {
        try {
            S3VideoService.BucketInfo bucketInfo = s3VideoService.getBucketInfo();
                        
            Map<String, Object> response = new HashMap<>();
            response.put("sourceBucket", bucketInfo.sourceBucket());
            response.put("outputBucket", bucketInfo.outputBucket());
            response.put("uploadFolder", bucketInfo.uploadFolder());
            response.put("vodFolder", bucketInfo.vodFolder());
                response.put("architecture", "R2 direct video storage");
                response.put("description", "Videos are uploaded to R2 and served directly from the public R2 URL");
                        
                log.info("Retrieved bucket configuration: Bucket={}, PublicBase={}", 
                    bucketInfo.sourceBucket(), bucketInfo.vodFolder());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get bucket info", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Failed to get bucket information",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/transcode-status/{courseId}/{lessonId}")
    public ResponseEntity<Map<String, Object>> getTranscodeStatus(
            @PathVariable String courseId,
            @PathVariable String lessonId) {
        try {
            boolean isAvailable = s3VideoService.isVideoTranscoded(courseId, lessonId);
                        
            Map<String, Object> response = new HashMap<>();
            response.put("courseId", courseId);
            response.put("lessonId", lessonId);
            response.put("isAvailable", isAvailable);
            response.put("status", isAvailable ? "ready" : "missing");
            response.put("playbackType", "R2_DIRECT");
                        
            log.info("Video availability for course {} lesson {}: {}", courseId, lessonId, 
                    isAvailable ? "ready" : "missing");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to check video availability: courseId={}, lessonId={}", courseId, lessonId, e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Failed to check video availability",
                "message", e.getMessage()
            ));
        }
    }

}
