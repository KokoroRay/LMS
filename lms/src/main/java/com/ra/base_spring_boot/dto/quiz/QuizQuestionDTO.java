package com.ra.base_spring_boot.dto.quiz;

import com.ra.base_spring_boot.model.constants.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestionDTO {

    private Integer questionId;

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    private Double points;

    private String choices;  // JSON string

    private String correctAnswer;  // JSON string (only for teachers, not shown to students)
}
