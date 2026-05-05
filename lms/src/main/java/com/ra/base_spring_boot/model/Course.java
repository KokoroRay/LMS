package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.CourseLevel;
import com.ra.base_spring_boot.model.constants.CourseStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "courses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_id")
    private Integer courseId;

    @Column(nullable = false)
    private String title;

    @Column(unique = true)
    private String slug;

    @Column(name = "short_description", length = 512, nullable = true)
    private String shortDescription;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseLevel level;

    @ManyToOne
    @JoinColumn(name = "category_id", foreignKey = @ForeignKey(name = "fk_course_category"))
    private CourseCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseStatus status;

    @OneToMany(mappedBy = "course")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<ClassCourseTeacherAssignment> classAssignments;

    @ManyToOne
    @JoinColumn(name = "created_by", foreignKey = @ForeignKey(name = "fk_course_creator"))
    private User createdBy;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "course_instructors",
            joinColumns = @JoinColumn(name = "course_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<User> courseInstructors = new HashSet<>();

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    @PrePersist
    @PreUpdate
    private void normalizeLevel() {
        if (this.level != null) {
            for (CourseLevel l : CourseLevel.values()) {
                if (l.name().equalsIgnoreCase(this.level.name())) {
                    this.level = l;
                    break;
                }
            }
        }
    }
}