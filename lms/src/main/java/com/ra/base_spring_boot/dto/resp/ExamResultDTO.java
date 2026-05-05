package com.ra.base_spring_boot.dto.resp;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamResultDTO {
    private Integer resultId;
    private Integer examId;
    private String examTitle;
    private Integer studentId;
    private String studentName;
    private Double score;
    private Integer timeSpent;
    private String githubUrl;
    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;
    private String feedback;
}
