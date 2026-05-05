package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "class_course_teacher_assignment", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"class_id", "course_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassCourseTeacherAssignment implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;
}