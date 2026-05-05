package com.ra.base_spring_boot.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "timetable",
        uniqueConstraints = @UniqueConstraint(columnNames = {"class_id", "date", "start_time", "end_time"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "classSessions") // loại bỏ classSessions để tránh vòng lặp
public class Timetable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "timetable_id")
    private Integer timetableId;

    @ManyToOne
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "meet_url", length = 512)
    private String meetUrl;

    @Column(name = "timezone", length = 64)
    private String timezone = "UTC";

    @Column(name = "note", length = 255)
    private String note;

    @OneToMany(mappedBy = "timetable", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private Set<ClassSession> classSessions = new HashSet<>();

    public void addSession(ClassSession session) {
        classSessions.add(session);
        session.setTimetable(this);
    }

    public void removeSession(ClassSession session) {
        classSessions.remove(session);
        session.setTimetable(null);
    }

    public enum DayOfWeek {
        Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
    }

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

}
