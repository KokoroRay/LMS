package com.ra.base_spring_boot.dto.req;

import com.ra.base_spring_boot.model.constants.QuestionType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddExamQuestionDTO {

    private Integer questionBankId;


    private String questionText;

    private QuestionType questionType;

    @NotNull(message = "Points is required")
    private Double points;

    private String choices;

    private String correctAnswer;

    private String starterCode;

    private String testCases;

    private String language;

    private Integer orderIndex;
}
