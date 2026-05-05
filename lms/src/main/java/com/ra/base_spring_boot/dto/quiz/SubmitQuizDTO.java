package com.ra.base_spring_boot.dto.quiz;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitQuizDTO {

    @NotEmpty(message = "Answers are required")
    @Valid
    private List<AnswerSubmissionDTO> answers;
}
