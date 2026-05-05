package com.ra.base_spring_boot.dto.resp;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SubmissionResponseDTO {
    private Integer submissionId;
    private Integer assignmentId;
    private String assignmentTitle;
    private Integer studentId;
    private String studentName;
    private Integer classId; // 🔹 thêm classId
    private String githubUrl;
    private Double grade;
    private String feedback;
    private LocalDateTime submittedAt;
    private String gradedByName;
    private LocalDateTime gradedAt;
    private Boolean isLate;
    private Long lateMinutes;
}
