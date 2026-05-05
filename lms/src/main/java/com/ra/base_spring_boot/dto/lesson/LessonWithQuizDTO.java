package com.ra.base_spring_boot.dto.lesson;

import com.ra.base_spring_boot.dto.QuestionBankDTO;
import lombok.*;

import java.util.List;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonWithQuizDTO {

    private Integer lessonId;
    private String title;
    private String description;
    private String content;
    private String videoUrl;
    private Integer durationMinutes;

    // Quiz information
    private Boolean hasQuiz; // Có quiz không
    private Integer totalQuestions;
    private Double totalPoints;

    // Questions trong quiz (không bao gồm correctAnswer khi lấy để làm bài)
    private List<QuestionBankDTO> questions;

    // Lịch sử làm bài của sinh viên (optional)
    private List<LessonQuizAttemptDTO> studentAttempts;
    private LessonQuizAttemptDTO bestAttempt;
}
