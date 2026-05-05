package com.ra.base_spring_boot.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.ra.base_spring_boot.model.constants.AttendanceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "class_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassSession {

    // Loại trừ các trường vòng lặp từ equals/hashCode

    @ManyToOne
    @JoinColumn(name = "class_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private ClassEntity classEntity;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Integer sessionId;

    @ManyToOne
    @JoinColumn(name = "timetable_id", nullable = false)
    @JsonBackReference
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Timetable timetable;

    @Column(name = "session_date")
    private LocalDate sessionDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "topic", length = 255)
    private String topic;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<AttendanceRecord> attendanceRecords = new ArrayList<>();

    public void addAttendanceRecord(User student) {
        if (attendanceRecords == null) attendanceRecords = new ArrayList<>();
        AttendanceRecord record = AttendanceRecord.builder()
                .session(this)
                .student(student)
                .status(AttendanceStatus.PRESENT)
                .build();
        attendanceRecords.add(record);
    }

    public ClassEntity getClassEntity() {
        return timetable != null ? timetable.getClassEntity() : null;
    }
}