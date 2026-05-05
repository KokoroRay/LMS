package com.ra.base_spring_boot.dto.resp;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseReviewResponseDTO {
    private Integer reviewId;
    private Integer courseId;
    private String courseTitle;
    private Integer studentId;
    private String studentName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
