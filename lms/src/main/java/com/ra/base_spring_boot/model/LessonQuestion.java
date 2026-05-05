package com.ra.base_spring_boot.model;

import com.fasterxml.jackson.annotation.JsonIgnore; // Added import
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_questions")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonQuestion {

    @Id
    @Column(name = "lesson_question_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer lessonQuestionId;

    @JsonIgnore // Added JsonIgnore
    @ManyToOne
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "question_id", nullable = false)
    private QuestionBank question;

    @Builder.Default
    private Integer orderIndex = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isRequired = true;

    @ManyToOne
    @JoinColumn(name = "added_by", nullable = false)
    private User addedBy;

    private LocalDateTime addedAt;

    @PrePersist
    protected void onCreate() {
        addedAt = LocalDateTime.now();
    }
}
