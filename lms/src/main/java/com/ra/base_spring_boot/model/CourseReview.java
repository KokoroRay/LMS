package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Integer reviewId;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false)
    private Integer rating; // 1 -> 5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", columnDefinition = "DATETIME")
    private LocalDateTime createdAt;
}
