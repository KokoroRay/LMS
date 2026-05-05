package com.ra.base_spring_boot.controller;// File: com.ra.base_spring_boot.controller.GradeCalculationController.java

import com.ra.base_spring_boot.services.GradeCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/grade-calculation")
@RequiredArgsConstructor
public class GradeCalculationController {

    private final GradeCalculationService gradeCalculationService;

    @PostMapping("/calculate/single")
    public ResponseEntity<String> calculateCourseGrade(
            @RequestParam Integer studentId,
            @RequestParam Integer classId,
            @RequestParam Integer courseId
    ) {
        gradeCalculationService.calculateSingleCourseGrade(studentId, classId, courseId);
        return ResponseEntity.ok("Grade calculated successfully for student " + studentId + " and course " + courseId + "!");
    }

    @PostMapping("/calculate/student")
    public ResponseEntity<String> calculateAllCoursesForStudent(
            @RequestParam Integer studentId,
            @RequestParam Integer classId
    ) {
        gradeCalculationService.calculateAllCourseGradesForStudent(studentId, classId);
        return ResponseEntity.ok("All course grades calculated successfully for student " + studentId + " in class " + classId + "!");
    }

    @PostMapping("/calculate/class/{classId}")
    public ResponseEntity<String> calculateGradesForClass(@PathVariable Integer classId) {
        gradeCalculationService.calculateGradesForClass(classId);
        return ResponseEntity.ok("Grades for class " + classId + " calculated successfully!");
    }
}
