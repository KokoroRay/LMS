package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer invoiceId;

    @OneToOne
    @JoinColumn(name = "payment_id", nullable = false, foreignKey = @ForeignKey(name = "fk_inv_payment"))
    private Payment payment;

    @Column(name = "invoice_code", nullable = false, unique = true)
    private String invoiceCode;

    @Column(name = "issued_date", nullable = false, updatable = false)
    @org.hibernate.annotations.CreationTimestamp
    private LocalDateTime issuedDate;

    @Column(name = "pdf_url")
    private String pdfUrl;
}
