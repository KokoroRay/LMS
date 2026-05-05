package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.CertificateDTO;
import com.ra.base_spring_boot.model.Certificate;
import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.CourseCategory;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.repository.ClassRepository;
import com.ra.base_spring_boot.repository.CourseCategoryRepository;
import com.ra.base_spring_boot.services.CertificateService;
import com.ra.base_spring_boot.services.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;
    private final IUserService userService;
    private final ClassRepository classRepository;
    private final CourseCategoryRepository categoryRepository;

    /** Lấy tất cả chứng chỉ của 1 student */
    @GetMapping("/student/{studentId}")
    public List<CertificateDTO> getCertificatesByStudent(@PathVariable Integer studentId) {
        User student = userService.findEntityById(studentId);
        List<Certificate> certificates = certificateService.getCertificatesByStudent(student);

        return certificates.stream()
                .map(CertificateDTO::new)
                .toList();
    }

    /** Lấy duy nhất chứng chỉ theo student + class + category */
    @GetMapping("/student/certificate")
    public CertificateDTO getCertificate(
            @RequestParam Integer studentId,
            @RequestParam Integer classId,
            @RequestParam Integer categoryId
    ) {
        User student = userService.findEntityById(studentId);

        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found: " + classId));

        CourseCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found: " + categoryId));

        Certificate cert = certificateService.getCertificate(student, classEntity, category);
        return new CertificateDTO(cert);
    }

    /** Download link PDF */
    @GetMapping("/download/{certificateId}")
    public String downloadCertificate(@PathVariable Integer certificateId) {
        Certificate cert = certificateService.findById(certificateId);
        if (cert.getCertificateUrl() == null) {
            throw new RuntimeException("Certificate file not available yet.");
        }
        return cert.getCertificateUrl();
    }

    /** Student khiếu nại chứng chỉ */
    @PostMapping(
            value = "/appeal/{certificateId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<CertificateDTO> submitCertificateAppeal(
            @PathVariable Integer certificateId,
            @RequestPart("reason") String reason,
            @RequestPart("proofFile") MultipartFile proofFile
    ) {
        Certificate cert = certificateService.submitAppeal(certificateId, reason, proofFile);
        return ResponseEntity.ok(new CertificateDTO(cert));
    }
}
