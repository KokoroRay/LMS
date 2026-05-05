package com.ra.base_spring_boot.dto.req;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ra.base_spring_boot.model.constants.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.*;
import java.util.List;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExamBankQuestionRequestDTO {

    @NotBlank(message = "Question text cannot be blank")
    private String questionText;

    @NotNull(message = "Question type cannot be null")
    private QuestionType questionType;

    private List<String> choices;

    private List<String> correctAnswers;

    @NotNull(message = "Points cannot be null")
    @Min(value = 0, message = "Points must be non-negative")
    private Double points;

}