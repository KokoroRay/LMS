package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.CategoryGradeDTO;
import com.ra.base_spring_boot.model.CategoryGrade;
import com.ra.base_spring_boot.repository.CategoryGradeRepository;
import com.ra.base_spring_boot.services.CategoryGradeService;
import com.ra.base_spring_boot.services.GradeCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/category-grades")
@RequiredArgsConstructor
public class CategoryGradeController {

    private final GradeCalculationService gradeCalculationService;
    private final CategoryGradeRepository categoryGradeRepository;
    private final CategoryGradeService categoryGradeService;

    /** Tính category grade cho cả class */
    @PostMapping("/calculate/class/{classId}")
    public String calculateCategoryGradesForClass(@PathVariable Integer classId) {
        gradeCalculationService.calculateGradesForClass(classId);
        return "Recalculated all category grades for class " + classId + " successfully!";
    }

    /** Tính category grade cho 1 học viên */
    @PostMapping("/calculate/student/{studentId}")
    public String calculateCategoryGradeForStudent(
            @PathVariable Integer studentId,
            @RequestParam Integer classId
    ) {
        categoryGradeService.calculateCategoryGrade(studentId, classId);
        return "Recalculated category grade for student " + studentId + " in class " + classId;
    }

    /** Xem category grade theo class */
    @GetMapping("/class/{classId}")
    public List<CategoryGradeDTO> getGradesByClass(@PathVariable Integer classId) {

        List<CategoryGrade> grades =
                categoryGradeRepository.findAllByClassEntity_ClassId(classId);

        return grades.stream().map(cg -> CategoryGradeDTO.builder()
                .id(cg.getCategoryGradeId())
                .studentName(cg.getStudent().getFullName())
                .categoryName(cg.getCategory().getName())
                .className(cg.getClassEntity().getClassName())
                .averageScore(cg.getAverageScore())
                .status(cg.getStatus().name())
                .build()
        ).toList();
    }

    /** Xem category grade theo student */
    @GetMapping("/student/{studentId}")
    public List<CategoryGradeDTO> getGradesByStudent(@PathVariable Integer studentId) {

        List<CategoryGrade> grades =
                categoryGradeRepository.findByStudentIdWithRelations(studentId);

        return grades.stream().map(cg -> CategoryGradeDTO.builder()
                .id(cg.getCategoryGradeId())
                .studentName(cg.getStudent().getFullName())
                .categoryName(cg.getCategory().getName())
                .className(cg.getClassEntity().getClassName())
                .averageScore(cg.getAverageScore())
                .status(cg.getStatus().name())
                .build()
        ).toList();
    }
}
