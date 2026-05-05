package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "survey_responses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveyResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "response_id")
    private Integer responseId;

    @ManyToOne
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private SurveyQuestion question;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User student;

    @Column(name = "student_id", nullable = false)
    private Integer studentId;

    @Column(columnDefinition = "TEXT")
    private String answer;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    private void syncStudentId() {
        if (student != null) {
            this.studentId = student.getId();
        }
    }
}
