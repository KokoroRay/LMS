package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.model.Certificate;
import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.CourseCategory;
import com.ra.base_spring_boot.model.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CertificateService {

    // Get certificates
    List<Certificate> getCertificatesByStudent(User student);

    Certificate getCertificate(User student, ClassEntity classEntity, CourseCategory category);

    Certificate findById(Integer certificateId);

    List<Certificate> findAllCertificates();

    // Create / revoke
    Certificate createCertificate(User student, ClassEntity classEntity, CourseCategory category);

    Certificate revokeCertificate(Integer certificateId, String revocationReason);

    // Appeals
    Certificate submitAppeal(Integer certificateId, String reason, MultipartFile proofFile);

    Certificate processCertificateAppeal(Integer certificateId, String decision, String adminFeedback);

    // Check existing
    boolean hasCertificate(Integer studentId, Integer courseId);

    // Issue by Course event
    Certificate issueAndEmailCertificate(Integer studentId, Integer classId, Integer courseId);

    // Issue by Category PASS (cách mới)
    Certificate issueCertificateIfEligible(Integer studentId, Integer classId);

    boolean hasPassedAllCourses(User student, CourseCategory category);

    // Kiểm tra pass môn cuối trong khóa (category)
    boolean hasPassedFinalCourse(User student, CourseCategory category);
}
