package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.CategoryGradeStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "category_grades",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "class_id", "category_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryGrade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_grade_id")
    private Integer categoryGradeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private CourseCategory category;

    private Double averageScore = 0.0;

    @Enumerated(EnumType.STRING)
    private CategoryGradeStatus status = CategoryGradeStatus.FAIL;

    private LocalDateTime gradedAt = LocalDateTime.now();
}
