package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_answers", uniqueConstraints = {
        @UniqueConstraint(name = "uq_attempt_question", columnNames = {"attempt_id", "question_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "answer_id")
    private Integer answerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private QuizAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question;

    @Column(name = "selected_options", columnDefinition = "JSON")
    private String selectedOptions;  // JSON string for selected option(s)

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;  // For SHORT_ANSWER type

    @Column(name = "github_url")
    private String githubUrl;  // Optional GitHub link

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @PrePersist
    protected void onCreate() {
        if (answeredAt == null) {
            answeredAt = LocalDateTime.now();
        }
    }
}
