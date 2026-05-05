package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.QuestionType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quiz_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Integer questionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type")
    @Builder.Default
    private QuestionType questionType = QuestionType.MCQ;

    @Builder.Default
    private Double points = 1.0;

    @Column(columnDefinition = "JSON")
    private String choices;  // JSON string for choices

    @Column(name = "correct_answer", columnDefinition = "JSON")
    private String correctAnswer;  // JSON string for correct answer(s)
}
