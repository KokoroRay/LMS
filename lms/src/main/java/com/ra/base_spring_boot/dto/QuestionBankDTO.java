package com.ra.base_spring_boot.dto;


import com.ra.base_spring_boot.model.constants.Difficulty;
import com.ra.base_spring_boot.model.constants.QuestionStatus;
import com.ra.base_spring_boot.model.constants.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Set;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionBankDTO {

    private Integer questionId;

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    private Difficulty difficulty;
    private Double points;
    private String choices;
    private String correctAnswer;
    private String explanation;
    private QuestionStatus status;
    private Set<Integer> tagIds;
    private Integer createdBy;
}
