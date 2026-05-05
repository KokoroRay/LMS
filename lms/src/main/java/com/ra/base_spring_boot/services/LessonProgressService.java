package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.req.LessonProgressRequestDTO;
import com.ra.base_spring_boot.dto.resp.EnrollmentProgressDTO;
import com.ra.base_spring_boot.dto.resp.LessonProgressDTO;

import java.util.List;

public interface LessonProgressService {
    LessonProgressDTO createOrUpdateProgress(Integer studentId, LessonProgressRequestDTO dto);
    List<LessonProgressDTO> getProgressByStudent(Integer studentId);
    LessonProgressDTO getLessonProgress(Integer studentId, Integer lessonId, Integer attemptNumber);
    List<EnrollmentProgressDTO> getEnrollmentProgress(Integer studentId);
}
