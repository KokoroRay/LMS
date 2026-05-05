package com.ra.base_spring_boot.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@Slf4j
public class S3VideoService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    @Value("${r2.bucket-name:lms-video}")
    private String bucketName;

    @Value("${r2.public-base-url:${R2_PUBLIC_BASE_URL:}}")
    private String publicBaseUrl;

    @Value("${r2.upload-folder:uploads/}")
    private String uploadFolder;

    @Value("${r2.public-domain:${R2_PUBLIC_DOMAIN:}}")
    private String publicDomain;

    private String bucketName() {
        return bucketName == null || bucketName.isBlank() ? "lms-vod" : bucketName.trim();
    }

    private String resolvedPublicBaseUrl() {
        if (publicBaseUrl != null && !publicBaseUrl.isBlank()) {
            return publicBaseUrl.trim().replaceAll("/$", "");
        }

        if (publicDomain != null && !publicDomain.isBlank()) {
            return publicDomain.trim().replaceAll("/$", "");
        }

        return "";
    }


    public String uploadVideo(MultipartFile file, String courseId, String lessonId) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Video file cannot be empty");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null ? 
            originalFilename.substring(originalFilename.lastIndexOf('.')) : ".mp4";
        String filename = UUID.randomUUID().toString() + extension;

        // 🎯 FIX: Sử dụng lessonId thật thay vì temp-timestamp
        String s3Key = String.format("%s%s/%s/%s", 
                uploadFolder, courseId, lessonId, filename);
        try {
            Map<String, String> metadata = new HashMap<>();
            metadata.put("course-id", courseId);
            metadata.put("lesson-id", lessonId);
            metadata.put("original-filename", originalFilename);
            metadata.put("content-type", file.getContentType());
            metadata.put("upload-timestamp", String.valueOf(System.currentTimeMillis()));

                PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName())
                    .key(s3Key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .metadata(metadata)
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

                log.info("Video uploaded successfully to R2: bucket={}, key={}, size={} bytes", 
                    bucketName(), s3Key, file.getSize());

            return s3Key;

        } catch (Exception e) {
                log.error("Failed to upload video to R2: bucket={}, key={}, error={}", 
                    bucketName(), s3Key, e.getMessage());
                throw new RuntimeException("R2 upload failed: " + e.getMessage(), e);
        }
    }

    public PreSignedUploadInfo generatePreSignedUploadUrl(String courseId, String lessonId, 
                                                         String filename, String contentType, 
                                                         int expirationMinutes) {
        String extension = filename.contains(".") ?
            filename.substring(filename.lastIndexOf('.')) : ".mp4";
        String uniqueFilename = UUID.randomUUID().toString() + extension;
        // 🎯 FIX: Sử dụng lessonId thật thay vì temp folder
        String s3Key = String.format("%s%s/%s/%s", 
                uploadFolder, courseId, lessonId, uniqueFilename);

        try {
                PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName())
                    .key(s3Key)
                    .contentType(contentType)
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(expirationMinutes))
                    .putObjectRequest(putRequest)
                    .build();

            String presignedUrl = s3Presigner.presignPutObject(presignRequest).url().toString();

                log.info("Generated pre-signed upload URL for R2: bucket={}, key={}, expires={}min", 
                    bucketName(), s3Key, expirationMinutes);

                return new PreSignedUploadInfo(presignedUrl, s3Key, bucketName());

        } catch (Exception e) {
                log.error("Failed to generate pre-signed upload URL for R2: bucket={}, key={}, error={}", 
                    bucketName(), s3Key, e.getMessage());
                throw new RuntimeException("R2 pre-signed URL generation failed: " + e.getMessage(), e);
        }
    }





    public void deleteVideo(String s3Key) {
        deleteVideoFromSourceBucket(s3Key);
    }

    public void deleteVideoFromSourceBucket(String s3Key) {
        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                        .bucket(bucketName())
                    .key(s3Key)
                    .build();

            s3Client.deleteObject(deleteRequest);

                    log.info("Video deleted from R2: bucket={}, key={}", bucketName(), s3Key);

        } catch (Exception e) {
                    log.error("Failed to delete video from R2: bucket={}, key={}, error={}", 
                        bucketName(), s3Key, e.getMessage());
                    throw new RuntimeException("R2 delete failed: " + e.getMessage(), e);
        }
    }



    public boolean isVideoTranscoded(String courseId, String lessonId) {
        try {
                String prefix = String.format("%s%s/%s/", uploadFolder, courseId, lessonId);

            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucketName())
                    .prefix(prefix)
                    .maxKeys(1)
                    .build();

            ListObjectsV2Response response = s3Client.listObjectsV2(listRequest);

                boolean exists = !response.contents().isEmpty();
                if (exists) {
                log.info("Direct video found in R2: bucket={}, path={}", bucketName(), prefix);
                } else {
                log.info("No video found in R2: courseId={}, lessonId={}, path={}", courseId, lessonId, prefix);
                }

                return exists;

        } catch (Exception e) {
                log.error("Error checking R2 video: courseId={}, lessonId={}, error={}", 
                    courseId, lessonId, e.getMessage());
            return false;
        }
    }

    public String findM3u8FileName(String courseId, String lessonId) {
        try {
            String resolvedPrefix = String.format("%s%s/%s/", uploadFolder, courseId, lessonId);
            log.info("Resolved R2 object prefix: courseId={}, lessonId={}, prefix={}", courseId, lessonId, resolvedPrefix);
            return resolvedPrefix;
        } catch (Exception e) {
            log.error("Error resolving R2 object prefix: courseId={}, lessonId={}, error={}", 
                    courseId, lessonId, e.getMessage());
            return null;
        }
    }

    public String resolvePublicUrl(String videoRef) {
        if (videoRef == null || videoRef.trim().isEmpty()) {
            return null;
        }

        String trimmed = videoRef.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }

        String baseUrl = resolvedPublicBaseUrl();
        if (baseUrl.isEmpty()) {
            return trimmed;
        }

        return baseUrl + "/" + trimmed.replaceFirst("^/+", "");
    }

    public String extractObjectKey(String videoRef) {
        if (videoRef == null || videoRef.trim().isEmpty()) {
            return null;
        }

        String trimmed = videoRef.trim();
        if (!(trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
            return trimmed;
        }

        try {
            URI uri = URI.create(trimmed);
            String path = uri.getPath();
            return path == null ? trimmed : path.replaceFirst("^/+", "");
        } catch (Exception e) {
            return trimmed;
        }
    }


    public Map<String, String> getVideoMetadata(String s3Key) {
        return getVideoMetadataFromSourceBucket(s3Key);
    }

    public Map<String, String> getVideoMetadataFromSourceBucket(String s3Key) {
        try {
                HeadObjectRequest headRequest = HeadObjectRequest.builder()
                    .bucket(bucketName())
                    .key(s3Key)
                    .build();

            HeadObjectResponse response = s3Client.headObject(headRequest);

            Map<String, String> metadata = new HashMap<>(response.metadata());
            metadata.put("content-length", String.valueOf(response.contentLength()));
            metadata.put("content-type", response.contentType());
            metadata.put("last-modified", response.lastModified().toString());
            metadata.put("bucket-type", "r2");

            return metadata;

        } catch (Exception e) {
            log.error("Failed to get video metadata from R2: bucket={}, key={}, error={}", 
                    bucketName(), s3Key, e.getMessage());
            throw new RuntimeException("R2 metadata retrieval failed: " + e.getMessage(), e);
        }
    }

    public BucketInfo getBucketInfo() {
        return new BucketInfo(bucketName(), bucketName(), uploadFolder, resolvedPublicBaseUrl());
    }
    public record PreSignedUploadInfo(
        String uploadUrl,
        String s3Key,
        String bucketName
    ) {}

    public record BucketInfo(
        String sourceBucket,
        String outputBucket, 
        String uploadFolder,
        String vodFolder
    ) {}
}