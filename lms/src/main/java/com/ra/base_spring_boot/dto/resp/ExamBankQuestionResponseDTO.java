package com.ra.base_spring_boot.dto.resp;

import com.ra.base_spring_boot.model.constants.QuestionType;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamBankQuestionResponseDTO {
    private Integer questionId;
    private String questionText;
    private QuestionType questionType;
    private Double points;
    private List<String> choices;
    private List<String> correctAnswers;
    private String createdByUsername;
    private LocalDateTime createdAt;
}