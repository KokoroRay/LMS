package com.ra.base_spring_boot.dto.resp;

import com.ra.base_spring_boot.model.constants.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List; // Import List

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionAnswerDTO {

    private Integer questionId;
    private String questionText;
    private QuestionType questionType;
    private Double points;

    private String studentAnswer;  // JSON string
    private String correctAnswer;  // JSON string

    private Boolean isCorrect;
    private Double earnedPoints;

    // Fields for coding questions
    private String language;
    private String starterCode;
    private String testCases;

    // --- THÊM MỚI ---
    private List<TestCaseResultDTO> testCaseResults;
}