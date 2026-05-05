package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.CategoryGradeStatus;
import com.ra.base_spring_boot.model.constants.GradeStatus; // THÊM IMPORT
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.CategoryGradeService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map; // ADDED
import java.util.Set;
import java.util.stream.Collectors; // ADDED

@Slf4j // THÊM
@Service
@RequiredArgsConstructor
public class CategoryGradeServiceImpl implements CategoryGradeService {

    private final CategoryGradeRepository categoryGradeRepo;
    private final CourseGradeRepository courseGradeRepo;
    private final ClassRepository classRepo;
    private final UserRepository userRepo;

    @Override
    public void calculateCategoryGrade(Integer studentId, Integer classId) {



        ClassEntity classEntity = classRepo.findById(classId)
                .orElseThrow(() -> new EntityNotFoundException("Class not found: " + classId));

        CourseCategory category = classEntity.getCategory();
        User student = userRepo.getReferenceById(studentId);

        Set<Course> coursesInClass = classEntity.getCourses(); // All courses assigned to THIS class and category
        if (coursesInClass.isEmpty()) {
            return;
        }

        List<CourseGrade> studentCourseGrades =
                courseGradeRepo.findByStudent_IdAndClassEntity_ClassId(studentId, classId);

        // Map courseId to CourseGrade for efficient lookup
        Map<Integer, CourseGrade> studentCourseGradesMap = studentCourseGrades.stream()
                .collect(Collectors.toMap(cg -> cg.getCourse().getCourseId(), cg -> cg));

        double totalScoreSum = 0; // Sum of final scores from passed courses
        int passedCoursesCount = 0;
        boolean allAssignedCoursesPassed = true; // Assume true, set to false if any course fails or is not graded

        for (Course assignedCourse : coursesInClass) {
            CourseGrade grade = studentCourseGradesMap.get(assignedCourse.getCourseId());

            if (grade == null) {
                allAssignedCoursesPassed = false;
                break;
            }

            if (grade.getStatus() != GradeStatus.PASS) {
                allAssignedCoursesPassed = false;
                break;
            }
            passedCoursesCount++;
            totalScoreSum += grade.getFinalScore();
        }

        // Determine if category is passed based on all courses being passed
        boolean isCategoryPassed = allAssignedCoursesPassed; // It is true only if the loop completed without a break

        // Calculate average score only for passed courses, if applicable
        double avgScore = (passedCoursesCount > 0) ? (totalScoreSum / passedCoursesCount) : 0;

        // Get or create CategoryGrade
        CategoryGrade categoryGrade = categoryGradeRepo
                .findByStudent_IdAndClassEntity_ClassId(studentId, classId)
                .orElse(CategoryGrade.builder()
                        .student(student)
                        .classEntity(classEntity)
                        .category(category)
                        .build()
                );

        categoryGrade.setAverageScore(avgScore);
        categoryGrade.setStatus(isCategoryPassed ? CategoryGradeStatus.PASS : CategoryGradeStatus.FAIL);
        categoryGrade.setGradedAt(LocalDateTime.now());
        


        categoryGradeRepo.save(categoryGrade);
    }

    @Override
    public boolean isCategoryPassed(Integer studentId, Integer classId) {
        return categoryGradeRepo
                .findByStudent_IdAndClassEntity_ClassId(studentId, classId)
                .map(g -> g.getStatus() == CategoryGradeStatus.PASS)
                .orElse(false);
    }

    @Override
    public void calculateAllCategoryGrades() {
        // (optional)
    }
}