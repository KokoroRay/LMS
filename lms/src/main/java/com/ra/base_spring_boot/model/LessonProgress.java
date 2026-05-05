package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonProgress {

    @EmbeddedId
    private LessonProgressId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("lessonId")
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @Column(name = "watched_seconds")
    private Integer watchedSeconds = 0;

    @Column(name = "is_completed")
    private Boolean isCompleted = false;

    @UpdateTimestamp
    @Column(name = "last_watched_at")
    private LocalDateTime lastWatchedAt;
}
