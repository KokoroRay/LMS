package com.ra.base_spring_boot.dto.quiz;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerSubmissionDTO {

    private Integer questionId;

    private String selectedOptions;  // JSON string for MCQ/MULTI/TRUE_FALSE

    private String answerText;  // For SHORT_ANSWER

    private String githubUrl;  // Optional
}
