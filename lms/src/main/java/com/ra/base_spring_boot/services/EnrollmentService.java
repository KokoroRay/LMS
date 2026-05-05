package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.EnrollmentDTO;
import java.util.List;

public interface EnrollmentService {
    List<EnrollmentDTO> getStudentsByClass(Integer classId);
    EnrollmentDTO addStudentToClass(Integer classId, Integer studentId);
    void removeStudentFromClass(Integer classId, Integer studentId);
    EnrollmentDTO updateStudentProgress(Integer classId, Integer studentId, Double progress, String status);
    void bulkAddStudentsToClass(Integer classId, List<Integer> studentIds);

}
