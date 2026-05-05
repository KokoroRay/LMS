package com.ra.base_spring_boot.dto.quiz;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAnswerDTO {

    private Integer answerId;

    private Integer questionId;

    private String questionText;

    private String selectedOptions;

    private String answerText;

    private String githubUrl;

    private Boolean isCorrect;

    private LocalDateTime answeredAt;

    // For teacher view only
    private String correctAnswer;
}
