package com.ra.base_spring_boot.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveyResponseDTO {
    private Integer responseId;
    private Integer surveyId;
    private Integer questionId;
    private Integer studentId;
    private String answer;
    private LocalDateTime submittedAt;
    private LocalDateTime updatedAt;
}
