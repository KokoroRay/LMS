package com.ra.base_spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResultItemDTO {
    private Integer questionId;
    private boolean correct;
    private double earnedPoints;
    private double maxPoints;
}
