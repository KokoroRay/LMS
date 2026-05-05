package com.ra.base_spring_boot.dto.resp;

import com.ra.base_spring_boot.model.constants.CourseLevel;
import com.ra.base_spring_boot.model.constants.CourseStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseDTO {
    private Integer courseId;
    private String title;
    private String slug;
    private String shortDescription;
    private String description;
    private BigDecimal price;
    private CourseLevel level;
    private Integer categoryId;
    private Integer createdById;
    private Set<Integer> teacherIds;
    private CourseStatus status;
    private String thumbnailUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Integer numClasses; // New field to store the count of classes assigned to this course

    private Double assignments_weight;
    private Double quizzes_weight;
    private Double exams_weight;
    private Double passing_score;
}