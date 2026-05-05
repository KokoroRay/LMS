package com.ra.base_spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResultDTO {
    private double totalScore;
    private double maxScore;
    private List<AnswerResultItemDTO> details;
}
