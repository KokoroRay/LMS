package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.ClassStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;


@Entity
@Table(
        name = "classes",
        indexes = {
                @Index(name = "idx_classes_category", columnList = "category_id"),
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "class_id")
    private Integer classId;

    @OneToMany(mappedBy = "classEntity", cascade = CascadeType.REMOVE, orphanRemoval = true)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<ClassCourseTeacherAssignment> classCourseTeacherAssignments = new HashSet<>(); // <-- ĐÃ SỬA TÊN

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false, foreignKey = @ForeignKey(name = "fk_class_category"))
    private CourseCategory category;

    @Column(name = "class_name", length = 150)
    private String className;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "capacity")
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ClassStatus status = ClassStatus.SCHEDULED;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @OneToMany(mappedBy = "classEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<Enrollment> enrollments = new HashSet<>();

    public void removeAssignment(ClassCourseTeacherAssignment assignment) {
        if (this.classCourseTeacherAssignments != null) {
            this.classCourseTeacherAssignments.remove(assignment);
        }
    }

    public Set<Course> getCourses() {
        return classCourseTeacherAssignments.stream()
                .map(ClassCourseTeacherAssignment::getCourse)
                .collect(Collectors.toSet());
    }

}