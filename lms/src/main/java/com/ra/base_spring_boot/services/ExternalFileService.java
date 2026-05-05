package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.model.Certificate;
import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.CourseCategory;
import com.ra.base_spring_boot.model.User;
import org.springframework.web.multipart.MultipartFile;

public interface ExternalFileService {
    String generateAndUploadCertificate(Certificate cert, User student, ClassEntity classEntity, CourseCategory category);
    String uploadFile(MultipartFile file, String folderName);
}