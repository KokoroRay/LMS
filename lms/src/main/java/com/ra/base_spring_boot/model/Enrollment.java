package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.EnrollmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "enrollments",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"class_id", "student_id"})})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "enrollment_id")
    private Integer enrollmentId;

    @ManyToOne
    @JoinColumn(name = "class_id")
    private ClassEntity classEntity;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student;

    @Column(name = "progress")
    @Builder.Default
    private Double progress = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    @Column(name = "enrolled_at")
    @Builder.Default
    private LocalDateTime enrolledAt = LocalDateTime.now();


}
