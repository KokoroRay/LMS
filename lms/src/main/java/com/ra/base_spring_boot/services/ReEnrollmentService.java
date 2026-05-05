package com.ra.base_spring_boot.services;

import java.util.List;

import com.ra.base_spring_boot.dto.resp.ReEnrollmentDTO;
import com.ra.base_spring_boot.model.constants.ReEnrollmentStatus;

public interface ReEnrollmentService {
    List<ReEnrollmentDTO> getAllByStudent(Integer studentId);
    ReEnrollmentDTO createReEnrollment(Integer studentId, Integer failedCourseGradeId);
    void updateStatus(Integer reEnrollmentId, ReEnrollmentStatus status);
    List<ReEnrollmentDTO> getAllForAdmin();
    List<ReEnrollmentDTO> getAll(); // Thêm method mới này

    void completeReEnrollment(Integer reEnrollmentId, Double assignmentScore, Double quizScore, Double examScore);
    List<ReEnrollmentDTO> getPaidReEnrollments();
    void activateRetakeExam(Integer reEnrollmentId, Integer adminId);
    List<ReEnrollmentDTO> getPendingActivationReEnrollments();
}
