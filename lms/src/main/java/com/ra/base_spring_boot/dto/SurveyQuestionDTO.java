package com.ra.base_spring_boot.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveyQuestionDTO {
    private Integer questionId;
    private Integer surveyId;
    private String questionText;
    private String questionType;
    private List<String> options;
}
