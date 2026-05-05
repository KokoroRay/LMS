package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity lưu câu trả lời của sinh viên cho từng câu hỏi trong lesson quiz
 */
@Entity
@Table(name = "lesson_quiz_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonQuizAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "answer_id")
    private Integer answerId;

    @ManyToOne
    @JoinColumn(name = "attempt_id", nullable = false)
    private LessonQuizAttempt attempt;

    @ManyToOne
    @JoinColumn(name = "lesson_question_id", nullable = false)
    private LessonQuestion lessonQuestion;

    @Column(name = "selected_options", columnDefinition = "json")
    private String selectedOptions; // JSON array cho MCQ/MULTI

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText; // Cho SHORT_ANSWER/ESSAY

    @Column(name = "is_correct")
    private Boolean isCorrect; // Kết quả chấm

    @Column(name = "points_earned")
    private Double pointsEarned; // Điểm đạt được cho câu này

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @PrePersist
    protected void onCreate() {
        if (answeredAt == null) {
            answeredAt = LocalDateTime.now();
        }
    }
}
