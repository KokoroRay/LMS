package com.ra.base_spring_boot.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ra.base_spring_boot.model.constants.CertificateStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "certificate_id")
    private Integer certificateId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private CourseCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = true)
    private Course course;

    private String certificateCode;
    private String certificateUrl;

    private LocalDate issueDate;

    @Enumerated(EnumType.STRING)
    private CertificateStatus status = CertificateStatus.ACTIVE;

    private String revocationReason;
    private String appealReason;
    private String appealProofUrl;

    private LocalDateTime createdAt;

    @PrePersist
    public void preCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.issueDate == null) {
            this.issueDate = LocalDate.now();
        }
    }
}