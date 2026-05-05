package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.QuizAttemptStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quiz_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attempt_id")
    private Integer attemptId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    private Double score;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private QuizAttemptStatus status = QuizAttemptStatus.IN_PROGRESS;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuizAnswer> answers = new ArrayList<>();

    @Column(name = "attempt_number")
    @Builder.Default
    private Integer attemptNumber = 1;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
    }

    // Helper methods
    public void addAnswer(QuizAnswer answer) {
        answers.add(answer);
        answer.setAttempt(this);
    }

    public boolean isExpired() {
        if (quiz == null || quiz.getDurationMinutes() == null || quiz.getDurationMinutes() == 0) {
            return false;
        }
        LocalDateTime deadline = startedAt.plusMinutes(quiz.getDurationMinutes());
        return LocalDateTime.now().isAfter(deadline);
    }
}
