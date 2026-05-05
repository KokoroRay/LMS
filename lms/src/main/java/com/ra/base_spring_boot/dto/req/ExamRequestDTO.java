package com.ra.base_spring_boot.dto.req;


import com.ra.base_spring_boot.model.constants.ExamType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamRequestDTO {

    @NotNull(message = "Class ID is required")
    private Integer classId;
    @NotNull(message = "Course ID is required")
    private Integer courseId;
    private String title;
    private String description;
    private ExamType examType;
    private Integer totalMarks;
    private Integer durationMinutes;
    private Boolean isPublished;
    private Integer maxAttempts;
    private Boolean showResultImmediately;

    private List<ExamSlotRequestDTO> examSlots;
    private List<QuestionFromBankRequestDTO> questionsFromBank;
    private List<CustomQuestionRequestDTO> customQuestions;

}