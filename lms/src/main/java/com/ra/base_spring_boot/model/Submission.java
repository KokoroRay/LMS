package com.ra.base_spring_boot.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Integer submissionId;

    @ManyToOne
    @JoinColumn(name = "assignment_id", nullable = false)
    @JsonIgnore
    private Assignment assignment;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnore
    private User student;

    @Column(name = "github_url", nullable = false, length = 500)
    private String githubUrl;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "grade")
    private Double grade;

    @ManyToOne
    @JoinColumn(name = "graded_by")
    @JsonIgnore
    private User gradedBy;

    @Column(name = "submitted_at", nullable = false)
    @Builder.Default
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    @Column(name = "is_late")
    @Builder.Default
    private Boolean isLate = false;

    @Column(name = "late_minutes")
    @Builder.Default
    private Long lateMinutes = 0L;

    @Column(name = "attempt_number")
    @Builder.Default
    private Integer attemptNumber = 1;

}
