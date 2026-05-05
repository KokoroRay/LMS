package com.ra.base_spring_boot.listeners;

import com.ra.base_spring_boot.events.GradeUpdatedEvent;
import com.ra.base_spring_boot.model.Certificate;
import com.ra.base_spring_boot.services.CertificateService;
import com.ra.base_spring_boot.services.GradeCalculationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class GradeEventListener {

    private final GradeCalculationService gradeCalculationService;
    private final CertificateService certificateService;

    @Async
    @EventListener
    public void handleGradeUpdate(GradeUpdatedEvent event) {

        Integer studentId = event.getStudentId();
        Integer classId = event.getClassId();

        try {
            gradeCalculationService.calculateAllCourseGradesForStudent(studentId, classId);
            
            Certificate certificate = certificateService.issueCertificateIfEligible(studentId, classId);

            if (certificate != null) {
                log.info("Certificate issued automatically: {} for Student: {}", certificate.getCertificateCode(), studentId);
            }

        } catch (Exception e) {
            log.error("Error in automatic certificate processing for Student: " + studentId, e);
        }
    }
}