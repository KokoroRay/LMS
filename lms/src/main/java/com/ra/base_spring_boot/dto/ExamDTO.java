package com.ra.base_spring_boot.dto;
import com.ra.base_spring_boot.model.constants.ExamType;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamDTO {
    private Integer examId;
    private Integer classId;
    private Integer courseId;
    private String courseTitle;
    private String className;
    private String title;
    private String description;
    private ExamType examType;
    private Integer totalMarks;
    private Integer durationMinutes;
    private Boolean isPublished;
    private Integer maxAttempts;
    private Boolean showResultImmediately;
    private LocalDateTime createdAt;
    private List<ExamSlotDTO> examSlots;
    private List<ExamQuestionDTO> examQuestions;
    private Integer studentAttempts;
    private Boolean hasSubmitted;
}