package com.ra.base_spring_boot.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.ra.base_spring_boot.model.constants.AttendanceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "attendance_records",
        uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "student_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "record_id")
    private Integer recordId;

    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    @JsonBackReference
    private ClassSession session;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus status = AttendanceStatus.PENDING;

    @Column(length = 255)
    private String note;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt = LocalDateTime.now();
}
