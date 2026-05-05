package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.services.CertificateOrchestrator;
import com.ra.base_spring_boot.services.GradeCalculationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/certificates/process")
@RequiredArgsConstructor
public class CertificateOrchestratorController {

    private final CertificateOrchestrator orchestrator;
    private final GradeCalculationService gradeCalculationService;

    /** FE chỉ gọi studentId + classId */
    @PostMapping
    public ResponseEntity<?> processCertificate(
            @RequestParam Integer studentId,
            @RequestParam String classId
    ) {
        try {
            orchestrator.processCertificateForStudent(studentId, classId);
            return ResponseEntity.ok("Đã xử lý tính điểm & cấp chứng chỉ (nếu đủ điều kiện).");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @GetMapping("/debug")
    public ResponseEntity<?> debugCertificateStatus(
            @RequestParam Integer studentId,
            @RequestParam String classId
    ) {
        try {
            java.util.Map<String, Object> debugInfo = orchestrator.debugCertificateStatus(studentId, classId);
            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PostMapping("/force-issue")
    public ResponseEntity<?> forceIssueCertificate(
            @RequestParam Integer studentId,
            @RequestParam String classId
    ) {
        try {
            java.util.Map<String, Object> result = orchestrator.forceIssueCertificate(studentId, classId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Kiểm tra điểm tất cả môn học và tính lại CategoryGrade */
    @GetMapping("/check-grades")
    public ResponseEntity<?> checkAllCourseGrades(
            @RequestParam Integer studentId,
            @RequestParam String classId
    ) {
        try {
            java.util.Map<String, Object> result = orchestrator.checkAllCourseGrades(studentId, classId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Tính lại toàn bộ điểm và cấp chứng chỉ - ENDPOINT CHÍNH */
    @PostMapping("/recalculate-and-issue")
    public ResponseEntity<?> recalculateAndIssueCertificate(
            @RequestParam Integer studentId,
            @RequestParam String classId
    ) {
        try {
            java.util.Map<String, Object> result = orchestrator.recalculateAndIssueCertificate(studentId, classId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    
    /**
     * Trigger lại automatic certificate flow 
     * Sử dụng khi muốn kích hoạt lại toàn bộ quá trình tự động
     * Khác với recalculate-and-issue vì endpoint này sử dụng event-driven architecture
     */
    @PostMapping("/trigger-automatic")
    public ResponseEntity<?> triggerAutomaticCertificate(
            @RequestParam Integer studentId,
            @RequestParam String classId
    ) {
        try {
            log.info("Triggering automatic certificate flow for Student: {}, Class: {}", studentId, classId);
            
            // Gọi service tính toàn bộ grades - sẽ publish GradeUpdatedEvent
            gradeCalculationService.calculateAllCourseGradesForStudent(studentId, classId);
            
            return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "message", "Đã trigger automatic certificate flow thành công! Kiểm tra logs để xem kết quả.",
                "studentId", studentId,
                "classId", classId,
                "note", "Hệ thống sẽ tự động cấp chứng chỉ thông qua GradeEventListener nếu điều kiện đạt"
            ));
        } catch (Exception e) {
            log.error("Error triggering automatic certificate: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(java.util.Map.of(
                "success", false,
                "error", e.getMessage(),
                "studentId", studentId,
                "classId", classId
            ));
        }
    }
}
