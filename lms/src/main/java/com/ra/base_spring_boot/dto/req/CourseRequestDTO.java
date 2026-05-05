package com.ra.base_spring_boot.dto.req;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.ra.base_spring_boot.dto.CourseLevelDeserializer;
import com.ra.base_spring_boot.model.constants.CourseLevel;
import com.ra.base_spring_boot.model.constants.CourseStatus;
import lombok.*;

import java.math.BigDecimal;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseRequestDTO {
    private String title;
    private String slug;
    private String shortDescription;
    private String description;
    private BigDecimal price;

    @JsonDeserialize(using = CourseLevelDeserializer.class)
    private CourseLevel level;

    private Integer categoryId;
    private Integer createdById;
    private Set<Integer> teacherIds;
    private CourseStatus status;

    private Double assignments_weight;
    private Double quizzes_weight;
    private Double exams_weight;
    private Double passing_score;
}