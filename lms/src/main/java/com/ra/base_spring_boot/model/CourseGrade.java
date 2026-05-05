package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.GradeStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_grades")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseGrade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_grade_id")
    private Integer courseGradeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    // ⭐ CHUẨN — map đúng với column trong DB
    @Column(name = "assignment_score")
    private Double assignmentScore;

    @Column(name = "quiz_score")
    private Double quizScore;

    @Column(name = "exam_score")
    private Double examScore;

    @Column(name = "final_score")
    private Double finalScore;

    @Enumerated(EnumType.STRING)
    private GradeStatus status;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id")
    private GradingPolicy policy;

    @Column(name = "attempt_number")
    private Integer attemptNumber;
}
