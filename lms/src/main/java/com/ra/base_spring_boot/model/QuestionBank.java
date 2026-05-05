package com.ra.base_spring_boot.model;


import com.ra.base_spring_boot.model.constants.Difficulty;
import com.ra.base_spring_boot.model.constants.QuestionStatus;
import com.ra.base_spring_boot.model.constants.QuestionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "question_banks")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionBank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer questionId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type")
    private QuestionType questionType;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    @Builder.Default
    private Double points = 1.0;

    @Column(columnDefinition = "json")
    private String choices;

    @Column(columnDefinition = "json")
    private String correctAnswer;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private QuestionStatus status = QuestionStatus.ACTIVE;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToMany
    @JoinTable(
            name = "question_tag_mapping",
            joinColumns = @JoinColumn(name = "question_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<QuestionTag> tags = new HashSet<>();

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
