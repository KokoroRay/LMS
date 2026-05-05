package com.ra.base_spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnswerSubmissionDTO {
    private Integer lessonId;
    private Integer submittedBy;
    private List<AnswerSubmissionItemDTO> answers;
    private Integer attemptNumber;
}
