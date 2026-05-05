package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.LessonQuizAttemptStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity lưu thông tin mỗi lần sinh viên làm quiz trong lesson
 */
@Entity
@Table(name = "lesson_quiz_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonQuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attempt_id")
    private Integer attemptId;

    @ManyToOne
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "score")
    private Double score;

    @Column(name = "total_questions")
    private Integer totalQuestions;

    @Column(name = "correct_answers")
    private Integer correctAnswers;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private LessonQuizAttemptStatus status = LessonQuizAttemptStatus.IN_PROGRESS;

    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds; // Thời gian làm bài (giây)

    @Column(name = "attempt_number")
    @Builder.Default
    private Integer attemptNumber = 1;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
    }
}
