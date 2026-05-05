package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.PaymentStatus;
import com.ra.base_spring_boot.model.constants.PaymentType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Integer paymentId;

    @Column(name = "transaction_ref", unique = true, nullable = false)
    private String transactionRef;

    // Student thanh toán
    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    // Khóa học (Category)
    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private CourseCategory category;

    private BigDecimal amount;

    @Builder.Default
    private String currency = "VND";

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    @Column(name = "provider_transaction_id")
    private String providerTransactionId;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        if (status == null)
            status = PaymentStatus.PENDING;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

     
}
