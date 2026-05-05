package com.ra.base_spring_boot.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload file (image/video/other) to a specific folder in Cloudinary.
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        Map<String, Object> options = new HashMap<>();
        options.put("folder", folder != null ? folder : "uploads");

        String contentType = file.getContentType();
        if (contentType != null) {
            if (contentType.startsWith("video/")) {
                options.put("resource_type", "video");
            } else {
                options.put("resource_type", "image");
            }
        } else {
            options.put("resource_type", "auto");
        }

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
        return uploadResult.get("secure_url").toString();
    }

    /**
     * Upload file to default "uploads" folder.
     */
    public String uploadFile(MultipartFile file) throws IOException {
        return uploadFile(file, "uploads");
    }

    /**
     * ✅ Giữ lại method cũ — để code cũ vẫn chạy.
     * (Thực chất gọi lại uploadFile để không lặp code)
     */
    public String uploadImage(MultipartFile file) throws IOException {
        return uploadFile(file, "uploads");
    }

    public String uploadImage(MultipartFile file, String folder) throws IOException {
        return uploadFile(file, folder);
    }

    /**
     * Delete a file by its public ID.
     */
    public void deleteFile(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "auto"));
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file from Cloudinary", e);
        }
    }
}