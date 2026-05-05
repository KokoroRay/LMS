package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.ReEnrollmentStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "re_enrollments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "re_enrollment_id") // Tên cột trong Db
    private Integer reEnrollmentId;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne
    @JoinColumn(name = "failed_course_grade_id", nullable = false)
    private CourseGrade failedCourseGrade;

    @ManyToOne
    @JoinColumn(name = "new_class_id")
    private ClassEntity newClass;

    @ManyToOne
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReEnrollmentStatus status = ReEnrollmentStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "requested_at", nullable = false)
    @Builder.Default
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column(name = "enrolled_at")
    private LocalDateTime enrolledAt;

    // ⭐ LUỒNG MỚI: Thông tin kích hoạt quyền thi lại
    @ManyToOne
    @JoinColumn(name = "activated_by_admin_id")
    private User activatedByAdmin;

    @Column(name = "retake_activated_at")
    private LocalDateTime retakeActivatedAt;

    private BigDecimal amount;

    @Column(length = 10)
    @Builder.Default
    private String currency = "VND"; //

    @PreUpdate
    private void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
