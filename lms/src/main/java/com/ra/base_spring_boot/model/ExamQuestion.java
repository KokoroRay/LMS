package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.QuestionType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_questions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ExamQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ex_q_id")
    private Integer exQId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, columnDefinition = "ENUM('MCQ','MULTI','TRUE_FALSE','SHORT_ANSWER','CODING') DEFAULT 'MCQ'")
    @Builder.Default
    private QuestionType questionType = QuestionType.MCQ;

    @Column(name = "points")
    @Builder.Default
    private Double points = 1.0;

    @Column(name = "choices", columnDefinition = "JSON")
    private String choices;

    @Column(name = "correct_answer", columnDefinition = "JSON")
    private String correctAnswer;

    // Các field này CÓ TRONG DATABASE → BẮT BUỘC phải map.
    @Column(name = "language")
    private String language;

    @Column(name = "orderIndex")
    private Integer orderIndex;

    @Column(name = "starterCode", columnDefinition = "TEXT")
    private String starterCode;

    @Column(name = "testCases", columnDefinition = "JSON")
    private String testCases;
}
