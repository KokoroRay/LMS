package com.ra.base_spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnswerSubmissionItemDTO {
    private Integer questionId;
    private String answer;
}
