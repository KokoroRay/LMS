package com.ra.base_spring_boot.services;

public interface CategoryGradeService {

    void calculateCategoryGrade(Integer studentId, Integer classId);

    boolean isCategoryPassed(Integer studentId, Integer classId);

    void calculateAllCategoryGrades(); // optional nếu muốn tính toàn bộ hệ thống
}
