package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.CourseGradeDTO;
import com.ra.base_spring_boot.model.CourseGrade;

import java.util.List;

public interface CourseGradeService {

    // ⭐ FE gọi để hiển thị điểm
    List<CourseGradeDTO> getGradesByStudent(Integer studentId);

    List<CourseGradeDTO> getGradesByClass(Integer classId);

    // ⭐ dùng cho tính toán
    CourseGrade calculateCourseGrade(Integer studentId, Integer classId, Integer courseId);

    CourseGrade findByStudentClassAndCourse(Integer studentId, Integer classId, Integer courseId);

    void triggerGradeCalculation(Integer studentId, Integer courseId);

    // ⭐ THÊM MỚI: Cập nhật điểm exam cho sinh viên học lại
    CourseGrade updateExamScoreForReEnrollment(Integer studentId, Integer classId, Integer courseId, Double examScore);

}
