package com.ra.base_spring_boot.dto.resp;

import com.ra.base_spring_boot.model.Course;
import com.ra.base_spring_boot.model.Enrollment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EnrollmentProgressDTO {
    private Integer courseId;
    private String courseTitle;
    private String courseImage;
    private Integer attemptNumber; // We might need to figure out how to derive this
    private Double progress;
    private Integer totalWorkItems;
    private Integer completedWorkItems;
}

