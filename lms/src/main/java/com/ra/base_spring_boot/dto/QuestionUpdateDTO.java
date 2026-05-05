package com.ra.base_spring_boot.dto;

import com.ra.base_spring_boot.model.constants.Difficulty;
import com.ra.base_spring_boot.model.constants.QuestionStatus;
import com.ra.base_spring_boot.model.constants.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionUpdateDTO {
    @NotNull(message = "Question ID is required")
    private Integer questionId;

    @NotBlank(message = "Question text cannot be empty")
    private String questionText;

    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    @NotNull(message = "Points are required")
    private Double points;

    @NotBlank(message = "Choices cannot be empty")
    private String choices; // JSON string

    @NotBlank(message = "Correct answer cannot be empty")
    private String correctAnswer; // JSON string

    private String explanation;

    @NotNull(message = "Status is required")
    private QuestionStatus status;
}
