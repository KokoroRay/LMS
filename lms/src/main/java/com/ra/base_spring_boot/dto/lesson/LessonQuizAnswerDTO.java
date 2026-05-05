package com.ra.base_spring_boot.dto.lesson;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonQuizAnswerDTO {

    private Integer answerId;
    private Integer attemptId;
    private Integer lessonQuestionId;
    private Integer questionId;
    private String questionText;
    private String selectedOptions; // JSON string
    private String answerText;
    private Boolean isCorrect;
    private Double pointsEarned;
    private Double maxPoints; // Điểm tối đa của câu
    private LocalDateTime answeredAt;

    // Thông tin câu hỏi (để hiển thị)
    private String questionType;
    private String choices; // JSON string
    private String correctAnswer; // JSON string (chỉ show sau khi submit)
    private String explanation;
}
