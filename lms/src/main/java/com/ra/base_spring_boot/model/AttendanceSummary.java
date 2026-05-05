package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "attendance_summary")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceSummary {

    @EmbeddedId
    private AttendanceSummaryId id;

    @Column(name = "total_sessions", nullable = false)
    private Integer totalSessions = 0;

    @Column(name = "attended_sessions", nullable = false)
    private Integer attendedSessions = 0;

    @Column(name = "absent_sessions", nullable = false)
    private Integer absentSessions = 0;

    @Column(name = "attendance_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal attendanceRate = BigDecimal.ZERO;
}
