package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "result_id")
    private Integer resultId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id")
    private ExamSlot examSlot;

    @Column
    private Double score;

    // --- THÊM MỚI: Lưu số lần vi phạm ---
    @Column(name = "violation_count")
    @Builder.Default
    private Integer violationCount = 0;
    // ------------------------------------

    @Column
    private Integer timeSpent;

    @Column(name = "answers", columnDefinition = "json")
    private String answers;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "ideSessionId")
    private String ideSessionId;

    @Column(name = "startedAt", columnDefinition = "datetime")
    private LocalDateTime startedAt;

    @Column(name = "submitted_at", columnDefinition = "timestamp")
    private LocalDateTime submittedAt;

    @Column(name = "graded_at", columnDefinition = "timestamp")
    private LocalDateTime gradedAt;

    @Column(columnDefinition = "text")
    private String feedback;

    @Column(name = "detailed_grades", columnDefinition = "json")
    private String detailedGrades;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
    }
}