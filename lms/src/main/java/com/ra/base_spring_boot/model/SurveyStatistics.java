package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "survey_statistics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveyStatistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stat_id")
    private Integer statId;

    @ManyToOne
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private SurveyQuestion question;

    @Column(name = "option_value")
    private String optionValue; // giá trị option (SINGLE_CHOICE, MULTI_CHOICE)

    @Column(name = "count")
    private Integer count = 0;  // số lần được chọn

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt = LocalDateTime.now();
}
