package com.ra.base_spring_boot.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveyDTO {
    private Integer surveyId;
    private Integer classId;
    private Integer courseId;
    private String title;
    private String description;
    private Integer createdBy;
    private LocalDateTime createdAt;
    private Boolean isActive;
}

