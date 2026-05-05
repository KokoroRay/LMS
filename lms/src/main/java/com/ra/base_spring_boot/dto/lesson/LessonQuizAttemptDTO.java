package com.ra.base_spring_boot.dto.lesson;

import com.ra.base_spring_boot.model.constants.LessonQuizAttemptStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonQuizAttemptDTO {

    private Integer attemptId;
    private Integer lessonId;
    private String lessonTitle;
    private Integer studentId;
    private String studentName;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Double score;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private LessonQuizAttemptStatus status;
    private Integer timeSpentSeconds;
    private Integer attemptNumber;

    // Chi tiết các câu trả lời (optional - chỉ include khi cần)
    private List<LessonQuizAnswerDTO> answers;

    // Thống kê
    private Double percentage; // Phần trăm điểm
    private Boolean isPassed; // Đạt/Không đạt
}
