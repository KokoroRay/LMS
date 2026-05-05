package com.ra.base_spring_boot.dto.quiz;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizDTO {

    private Integer quizId;

    @NotNull(message = "Class ID is required")
    private Integer classId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Integer totalMarks;

    private Integer durationMinutes;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Boolean isPublished;

    @Valid
    @Builder.Default
    private List<QuizQuestionDTO> questions = new ArrayList<>();

    // Statistics (for responses)
    private Long totalAttempts;
    private Long submittedAttempts;
}
