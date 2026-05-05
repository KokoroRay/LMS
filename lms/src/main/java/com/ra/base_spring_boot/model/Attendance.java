package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.AttendanceStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "attendance",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_student_timetable",
                columnNames = {"student_id", "timetable_id"}
        )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attendance_id")
    private Integer attendanceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student; // User có role = STUDENT

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "timetable_id", nullable = false)
    private Timetable timetable;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AttendanceStatus status = AttendanceStatus.PRESENT;

    @Column(name = "note", length = 255)
    private String note;

    @Column(name = "checked_at")
    private java.time.LocalDateTime checkedAt;

}
