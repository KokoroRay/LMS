package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lessons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lesson_id")
    private Integer lessonId;

    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "video_url", length = 512)
    private String videoUrl;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "quiz_id")
    private Integer quizId; // chỉ lưu id quiz để đơn giản

    @Column(name = "quiz_duration_minutes")
    private Integer quizDurationMinutes;
}