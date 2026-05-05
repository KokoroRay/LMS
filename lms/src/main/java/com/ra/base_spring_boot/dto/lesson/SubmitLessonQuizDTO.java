package com.ra.base_spring_boot.dto.lesson;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitLessonQuizDTO {

    @NotNull(message = "Attempt ID is required")
    private Integer attemptId;

    @NotEmpty(message = "Answers cannot be empty")
    @Valid
    private List<LessonQuizAnswerSubmissionDTO> answers;
}
