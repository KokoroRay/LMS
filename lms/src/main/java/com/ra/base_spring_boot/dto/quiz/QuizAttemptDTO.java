package com.ra.base_spring_boot.dto.quiz;

import com.ra.base_spring_boot.model.constants.QuizAttemptStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttemptDTO {

    private Integer attemptId;

    private Integer quizId;

    private String quizTitle;

    private Integer studentId;

    private String studentName;

    private LocalDateTime startedAt;

    private LocalDateTime submittedAt;

    private Double score;
    private QuizAttemptStatus status;
    private Integer attemptNumber;
    private List<QuizAnswerDTO> answers;
    private int correctCount;
    private int totalQuestions;
}
