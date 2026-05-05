package com.ra.base_spring_boot.dto.req;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseReviewRequestDTO {
    private Integer courseId;
    private Integer studentId;
    private Integer rating;
    private String comment;
}
