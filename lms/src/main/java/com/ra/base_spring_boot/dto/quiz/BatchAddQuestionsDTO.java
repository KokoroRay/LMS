package com.ra.base_spring_boot.dto.quiz;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for batch adding questions from Question Bank to Quiz
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchAddQuestionsDTO {
    
    @NotEmpty(message = "Questions list cannot be empty")
    @Valid
    private List<AddQuestionFromBankDTO> questions;
}
