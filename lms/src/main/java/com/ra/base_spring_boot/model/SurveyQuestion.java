package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "survey_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveyQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Integer questionId;

    @ManyToOne
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType questionType;

    @Column(columnDefinition = "json")
    private String options; // JSON lưu các lựa chọn

    public enum QuestionType {
        TEXT, SINGLE_CHOICE, MULTI_CHOICE, RATING
    }
}
