package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.SurveyQuestion;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "surveys")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Survey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "survey_id")
    private Integer surveyId;

    @Column(name = "class_id")
    private Integer classId;

    @Column(name = "course_id")
    private Integer courseId;

    private String title;
    private String description;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "is_active")
    private Boolean isActive;

}
