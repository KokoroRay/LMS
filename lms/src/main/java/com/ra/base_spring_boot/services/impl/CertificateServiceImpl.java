package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.CertificateStatus;
import com.ra.base_spring_boot.model.constants.GradeStatus; // <-- THÊM IMPORT NÀY
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.CertificateService;
import com.ra.base_spring_boot.services.EmailNotificationService;
import com.ra.base_spring_boot.services.ExternalFileService;
import com.ra.base_spring_boot.services.CategoryGradeService; // <-- THÊM IMPORT NÀY
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateServiceImpl implements CertificateService {

    private final CertificateRepository certificateRepository;
    private final ExternalFileService externalFileService;
    private final EmailNotificationService emailNotificationService;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final CategoryGradeRepository categoryGradeRepository;
    private final CategoryGradeService categoryGradeService;

    // ***************************************************************
    // ✅ SỬA LỖI: Xóa IExamService và thêm CourseGradeRepository
    // ***************************************************************
    private final CourseGradeRepository courseGradeRepository;

    private String generateReadableCertificateCode(CourseCategory category, User student) {
        String base = category.getName().toUpperCase();
        String normalized = Normalizer.normalize(base, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

        String slug = pattern.matcher(normalized).replaceAll("")
                .replaceAll("[^A-Z0-9]+", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");

        return "CERT-" + slug + "-" + student.getId() + "-" + LocalDate.now().getYear();
    }

    @Override
    public List<Certificate> getCertificatesByStudent(User student) {
        return certificateRepository.findAllByStudent(student);
    }

    @Override
    public Certificate getCertificate(User student, ClassEntity classEntity, CourseCategory category) {
        return certificateRepository.findByStudentAndClassEntityAndCategory(student, classEntity, category);
    }

    @Override
    @Transactional
    public Certificate revokeCertificate(Integer certificateId, String reason) {
        Certificate cert = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new RuntimeException("Certificate not found " + certificateId));

        if (cert.getStatus() == CertificateStatus.ACTIVE ||
                cert.getStatus() == CertificateStatus.PENDING_REVIEW) {

            cert.setStatus(CertificateStatus.REVOKED);
            cert.setRevocationReason(reason);
            cert.setAppealReason(null);
            cert.setAppealProofUrl(null);
            certificateRepository.save(cert);
            emailNotificationService.sendRevocationEmail(cert, reason);
        }
        return cert;
    }

    @Override
    public Certificate findById(Integer certificateId) {
        return certificateRepository.findById(certificateId)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
    }

    @Override
    public List<Certificate> findAllCertificates() {
        return certificateRepository.findAll();
    }

    @Override
    @Transactional
    public Certificate submitAppeal(Integer certificateId, String reason, MultipartFile proofFile) {
        Certificate cert = findById(certificateId);

        if (cert.getStatus() != CertificateStatus.REVOKED) {
            throw new RuntimeException("Chỉ chứng chỉ đã thu hồi mới được khiếu nại.");
        }
        String proofUrl = externalFileService.uploadFile(proofFile, "certificate_appeals");
        cert.setStatus(CertificateStatus.PENDING_REVIEW);
        cert.setAppealReason(reason);
        cert.setAppealProofUrl(proofUrl);
        return certificateRepository.save(cert);
    }

    @Override
    @Transactional
    public Certificate processCertificateAppeal(Integer certificateId, String decision, String adminFeedback) {
        Certificate cert = findById(certificateId);

        if (cert.getStatus() != CertificateStatus.PENDING_REVIEW) {
            throw new RuntimeException("Không thể duyệt khiếu nại chứng chỉ không nằm ở trạng thái chờ.");
        }
        boolean approved = decision.equalsIgnoreCase("APPROVE");

        if (approved) {
            cert.setStatus(CertificateStatus.ACTIVE);
            cert.setRevocationReason(null);
        } else {
            cert.setStatus(CertificateStatus.REVOKED);
        }
        cert.setAppealReason(null);
        cert.setAppealProofUrl(null);
        certificateRepository.save(cert);
        emailNotificationService.sendAppealResultEmail(cert, approved, adminFeedback);
        return cert;
    }

    @Override
    @Transactional
    public Certificate createCertificate(User student, ClassEntity classEntity, CourseCategory category) {

        log.info("Bắt đầu tạo chứng chỉ cho Student: {}, Class: {}, Category: {}", 
                 student.getId(), classEntity.getClassId(), category.getName());

        boolean alreadyExists = certificateRepository
                .existsByStudent_IdAndClassEntity_ClassIdAndCategory_CategoryId(
                        student.getId(),
                        classEntity.getClassId(),
                        category.getCategoryId()
                );

        if (alreadyExists) {
            log.warn("Chứng chỉ cho Student {} (Class {}, Category {}) đã tồn tại. Bỏ qua.",
                    student.getId(), classEntity.getClassId(), category.getCategoryId());
            return null;
        }

        String certCode = generateReadableCertificateCode(category, student);

        Certificate cert = new Certificate();
        cert.setStudent(student);
        cert.setClassEntity(classEntity);
        cert.setCategory(category);
        cert.setCourse(null);
        cert.setCertificateCode(certCode);
        cert.setIssueDate(LocalDate.now());
        cert.setStatus(CertificateStatus.ACTIVE);
        cert.setAppealReason(null);
        cert.setAppealProofUrl(null);
        cert.setRevocationReason(null);

        String url = externalFileService.generateAndUploadCertificate(cert, student, classEntity, category);
        cert.setCertificateUrl(url);

        certificateRepository.save(cert);
        log.info("Đã tạo thành công chứng chỉ {} cho Student: {}", certCode, student.getId());
        
        emailNotificationService.sendCertificateEmail(cert);
        log.info("Đã gửi email thông báo chứng chỉ cho Student: {}", student.getId());

        return cert;
    }

    @Override
    public boolean hasCertificate(Integer studentId, Integer courseId) {
        return certificateRepository.existsByStudent_IdAndCourse_CourseId(studentId, courseId);
    }

    @Override
    @Transactional
    public Certificate issueAndEmailCertificate(Integer studentId, Integer classId, Integer courseId) {
        log.info("Hàm [issueAndEmailCertificate] được gọi, đang chuyển tiếp qua [issueCertificateIfEligible]...");
        return this.issueCertificateIfEligible(studentId, classId);
    }

    @Override
    @Transactional
    public Certificate issueCertificateIfEligible(Integer studentId, Integer classId) {
        boolean passedCategory = categoryGradeService.isCategoryPassed(studentId, classId);

        if (!passedCategory) {
            log.info("-> Điều kiện [issueCertificateIfEligible]: CategoryGrade = FAIL. Không cấp.");
            return null;
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        CourseCategory category = classEntity.getCategory();

        log.info("-> Điều kiện [issueCertificateIfEligible]: CategoryGrade = PASS. Đang gọi createCertificate...");
        return createCertificate(student, classEntity, category);
    }

    private boolean checkCoursePass(Integer studentId, Integer courseId) {
        return courseGradeRepository
                .findByStudent_IdAndCourse_CourseId(studentId, courseId)
                .map(grade -> grade.getStatus() == GradeStatus.PASS)
                .orElse(false);
    }

    @Override
    public boolean hasPassedFinalCourse(User student, CourseCategory category) {
        List<Course> courses = courseRepository.findByCategory(category);
        if (courses.isEmpty()) return false;

        Course finalCourse = courses.get(courses.size() - 1);
        return checkCoursePass(student.getId(), finalCourse.getCourseId());
    }

    @Override
    public boolean hasPassedAllCourses(User student, CourseCategory category) {
        List<Course> courses = courseRepository.findByCategory(category);
        if (courses.isEmpty()) return false;

        return courses.stream()
                .allMatch(course -> checkCoursePass(student.getId(), course.getCourseId()));
    }
}