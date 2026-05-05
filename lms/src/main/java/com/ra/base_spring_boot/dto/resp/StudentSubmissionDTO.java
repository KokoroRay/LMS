package com.ra.base_spring_boot.dto.resp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for student submission detail (for instructor)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSubmissionDTO {

    private Integer resultId;

    private Integer examId;

    private String examTitle;

    private Integer studentId;

    private String studentName;

    private String studentEmail;

    private Double score; // Đây là điểm đã quy đổi (ví dụ: 32.5)

    private LocalDateTime startedAt;

    private LocalDateTime submittedAt;

    private LocalDateTime gradedAt;

    private Integer timeSpent;  // In minutes

    private String answers;  // JSON string of all answers

    private String githubUrl;

    private String feedback;  // Teacher's feedback

    private Integer gradedBy;  // Teacher ID who graded

    private String gradedByName;  // Teacher name

    // *** THÊM 2 DÒNG NÀY VÀO ***
    private Integer totalMarks; // Thang điểm của bài thi (ví dụ: 100)
    private Double maxRawScore; // Tổng điểm thô của các câu hỏi (ví dụ: 10)

    private List<SubmissionAnswerDTO> answerDetails;  // Chi tiết từng câu trả lời

    private Integer violationCount;
}