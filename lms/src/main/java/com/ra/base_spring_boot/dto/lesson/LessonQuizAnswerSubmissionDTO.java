package com.ra.base_spring_boot.dto.lesson;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonQuizAnswerSubmissionDTO {

    @NotNull(message = "Lesson Question ID is required")
    private Integer lessonQuestionId;

    // Dùng cho MCQ/MULTI/TRUE_FALSE
    private String selectedOptions; // JSON string ["A", "B"] hoặc ["true"]

    // Dùng cho SHORT_ANSWER/ESSAY
    private String answerText;
}
