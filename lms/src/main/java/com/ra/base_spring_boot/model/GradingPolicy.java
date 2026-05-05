package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "grading_policies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradingPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "policy_id")
    private Integer policyId;

    @Column(name = "assignments_weight", nullable = false)
    private Double assignmentsWeight;

    @Column(name = "quizzes_weight", nullable = false)
    private Double quizzesWeight;

    @Column(name = "exams_weight", nullable = false)
    private Double examsWeight;

    @Column(name = "passing_score", nullable = false)
    private Double passingScore;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", referencedColumnName = "course_id", nullable = false, unique = true)
    private Course course;

}