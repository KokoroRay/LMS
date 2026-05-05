package com.ra.base_spring_boot.dto.quiz;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for updating question points in a quiz
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateQuestionPointsDTO {
    
    @NotNull(message = "Points is required")
    @DecimalMin(value = "0.0", message = "Points must be positive")
    private BigDecimal points;
}
