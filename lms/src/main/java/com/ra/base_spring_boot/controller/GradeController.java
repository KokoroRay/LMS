package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.services.CategoryGradeService;
import com.ra.base_spring_boot.services.CertificateService;
import com.ra.base_spring_boot.repository.CategoryGradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@Slf4j
@RestController
@RequestMapping("/grades")
@RequiredArgsConstructor
public class GradeController {

    private final CategoryGradeService categoryGradeService;
    private final CategoryGradeRepository categoryGradeRepository;
    private final CertificateService certificateService;

    @PostMapping("/recalculate-category")
    public ResponseEntity<?> recalculateCategoryGrade(
            @RequestParam Integer studentId,
            @RequestParam Integer classId
    ) {
        try {
            log.info("FORCE RECALCULATE: Student {}, Class {}", studentId, classId);
            
            categoryGradeService.calculateCategoryGrade(studentId, classId);
            
            var categoryGradeOpt = categoryGradeRepository.findByStudent_IdAndClassEntity_ClassId(studentId, classId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("studentId", studentId);
            result.put("classId", classId);
            
            if (categoryGradeOpt.isPresent()) {
                var catG = categoryGradeOpt.get();
                result.put("categoryGrade", Map.of(
                    "categoryName", catG.getCategory().getName(),
                    "averageScore", catG.getAverageScore(),
                    "status", catG.getStatus().toString(),
                    "gradedAt", catG.getGradedAt().toString()
                ));
                
                // Check if certificate can be issued
                var certificate = certificateService.issueCertificateIfEligible(studentId, classId);
                result.put("certificateIssued", certificate != null);
                if (certificate != null) {
                    result.put("certificateCode", certificate.getCertificateCode());
                }
                
                result.put("message", "Category grade recalculated successfully!");
            } else {
                result.put("message", "Could not calculate category grade. Please check course grades.");
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error recalculating category grade: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/force-recalculate-all")
    public ResponseEntity<?> forceRecalculateAll(
            @RequestParam Integer studentId,
            @RequestParam Integer classId
    ) {
        try {
            log.info("FORCE RECALCULATE ALL: Student {}, Class {}", studentId, classId);
            
            // 1. Xóa CategoryGrade cũ (nếu có)
            var existingCategoryGrade = categoryGradeRepository.findByStudent_IdAndClassEntity_ClassId(studentId, classId);
            if (existingCategoryGrade.isPresent()) {
                log.info("Deleting existing CategoryGrade: {}", existingCategoryGrade.get().getCategoryGradeId());
                categoryGradeRepository.delete(existingCategoryGrade.get());
            }
            
            // 2. Tính lại CategoryGrade từ đầu
            categoryGradeService.calculateCategoryGrade(studentId, classId);
            
            // 3. Kiểm tra kết quả
            var newCategoryGrade = categoryGradeRepository.findByStudent_IdAndClassEntity_ClassId(studentId, classId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("studentId", studentId);
            result.put("classId", classId);
            result.put("deletedOldRecord", existingCategoryGrade.isPresent());
            
            if (newCategoryGrade.isPresent()) {
                var catG = newCategoryGrade.get();
                result.put("newCategoryGrade", Map.of(
                    "categoryName", catG.getCategory().getName(),
                    "averageScore", catG.getAverageScore(),
                    "status", catG.getStatus().toString(),
                    "gradedAt", catG.getGradedAt().toString()
                ));
                
                // Thử cấp chứng chỉ
                var certificate = certificateService.issueCertificateIfEligible(studentId, classId);
                result.put("certificateIssued", certificate != null);
                if (certificate != null) {
                    result.put("certificateCode", certificate.getCertificateCode());
                }
                
                result.put("message", "All grades force recalculated successfully!");
            } else {
                result.put("message", "Could not create new category grade. Check course grades.");
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error force recalculating all grades: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getGradeStatus(
            @RequestParam Integer studentId,
            @RequestParam Integer classId
    ) {
        try {
            Map<String, Object> result = new HashMap<>();
            
            var categoryGradeOpt = categoryGradeRepository.findByStudent_IdAndClassEntity_ClassId(studentId, classId);
            
            result.put("studentId", studentId);
            result.put("classId", classId);
            
            if (categoryGradeOpt.isPresent()) {
                var catG = categoryGradeOpt.get();
                result.put("categoryPassed", catG.getStatus().toString().equals("PASS"));
                result.put("categoryName", catG.getCategory().getName());
                result.put("averageScore", catG.getAverageScore());
            } else {
                result.put("categoryPassed", false);
                result.put("categoryName", "Unknown");
                result.put("message", "No category grade found");
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
}