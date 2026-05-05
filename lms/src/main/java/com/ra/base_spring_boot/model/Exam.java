package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.ExamType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exams")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exam_id")
    private Integer examId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "examType", nullable = false)
    private ExamType examType;

    @Column(name = "total_marks")
    private Integer totalMarks;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Builder.Default
    @Column(name = "isPublished")
    private Boolean isPublished = false;

    @Builder.Default
    private Integer maxAttempts = 1;

    @Builder.Default
    @Column(name = "showResultImmediately")
    private Boolean showResultImmediately = false;

    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    }

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ExamQuestion> examQuestions = new ArrayList<>();

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ExamSlot> examSlots = new ArrayList<>();

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ExamResult> examResults = new ArrayList<>();
}
