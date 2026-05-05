package com.ra.base_spring_boot.dto;

import com.ra.base_spring_boot.model.Course;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradingPolicyDTO {
    private Integer policyId;
    private Integer courseId;
    private Double assignmentsWeight; // % điểm assignment
    private Double quizzesWeight;     // % điểm quiz
    private Double examsWeight;       // % điểm exam
    private Double passingScore;      // điểm tối thiểu
    private Course course;
}
