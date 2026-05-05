package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity
@Table(name = "assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignment_id")
    private Integer assignmentId;

//    @ManyToOne
//    @JoinColumn(name = "class_id", nullable = false)
//    private ClassEntity classEntity;

    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course; // thêm course

    @Column(name = "title")
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "max_score")
    private BigDecimal maxScore;

    @Column(name = "allow_late")
    private Boolean allowLate;
}
