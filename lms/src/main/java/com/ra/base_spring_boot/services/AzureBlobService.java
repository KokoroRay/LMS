package com.ra.base_spring_boot.services;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

public interface AzureBlobService {
    
    /**
     * Upload video file to Azure Blob Storage
     * @param videoFile the video file to upload
     * @param containerType "upload" or "vod" 
     * @return URL of uploaded video
     */
    String uploadVideo(MultipartFile videoFile, String containerType) throws IOException;
    
    /**
     * Upload video from InputStream
     * @param inputStream video input stream
     * @param fileName original file name
     * @param contentType content type (e.g., "video/mp4")
     * @param containerType "upload" or "vod"
     * @return URL of uploaded video
     */
    String uploadVideo(InputStream inputStream, String fileName, String contentType, String containerType) throws IOException;
    
    /**
     * Delete video from Azure Blob Storage
     * @param videoUrl the URL of video to delete
     * @param containerType "upload" or "vod"
     * @return true if deleted successfully
     */
    boolean deleteVideo(String videoUrl, String containerType);
    
    /**
     * Generate SAS URL for video streaming with expiration
     * @param blobName the blob name
     * @param containerType "upload" or "vod"
     * @param expirationHours hours until expiration
     * @return SAS URL for streaming
     */
    String generateSasUrl(String blobName, String containerType, int expirationHours);
    
    /**
     * Check if video exists in blob storage
     * @param blobName the blob name
     * @param containerType "upload" or "vod"
     * @return true if exists
     */
    boolean videoExists(String blobName, String containerType);
    
    /**
     * Get video metadata
     * @param blobName the blob name
     * @param containerType "upload" or "vod"
     * @return video metadata
     */
    VideoMetadata getVideoMetadata(String blobName, String containerType);
    
    /**
     * Move video from upload container to VOD container
     * @param blobName the blob name
     * @return new URL in VOD container
     */
    String moveToVodContainer(String blobName);
    
    /**
     * Video metadata class
     */
    class VideoMetadata {
        private String fileName;
        private long fileSize;
        private String contentType;
        private String lastModified;
        
        // Constructors, getters, setters
        public VideoMetadata() {}
        
        public VideoMetadata(String fileName, long fileSize, String contentType, String lastModified) {
            this.fileName = fileName;
            this.fileSize = fileSize;
            this.contentType = contentType;
            this.lastModified = lastModified;
        }
        
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        
        public long getFileSize() { return fileSize; }
        public void setFileSize(long fileSize) { this.fileSize = fileSize; }
        
        public String getContentType() { return contentType; }
        public void setContentType(String contentType) { this.contentType = contentType; }
        
        public String getLastModified() { return lastModified; }
        public void setLastModified(String lastModified) { this.lastModified = lastModified; }
    }
}