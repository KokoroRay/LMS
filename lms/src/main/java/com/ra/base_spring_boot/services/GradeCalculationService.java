package com.ra.base_spring_boot.services;

public interface GradeCalculationService {

    void calculateAllCourseGradesForStudent(Integer studentId, Integer classId);
    
    // Overload method để hỗ trợ String classId từ frontend
    default void calculateAllCourseGradesForStudent(Integer studentId, String classId) {
        // Default implementation - sẽ được override trong impl
    }

    void calculateSingleCourseGrade(Integer studentId, Integer classId, Integer courseId);

    void calculateGradesForClass(Integer classId);
}