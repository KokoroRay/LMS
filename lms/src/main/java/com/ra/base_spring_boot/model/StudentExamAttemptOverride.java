package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "student_exam_attempt_override",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "exam_id"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamAttemptOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "override_id")
    private Integer overrideId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "extra_attempts", nullable = false)
    @Builder.Default
    private Integer extraAttempts = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "granted_by_instructor_id", nullable = false)
    private User grantedByInstructor;

    @Column(name = "granted_at", nullable = false, updatable = false)
    private LocalDateTime grantedAt;

    @PrePersist
    protected void onCreate() {
        if (grantedAt == null) {
            grantedAt = LocalDateTime.now();
        }
    }
}