package com.ra.base_spring_boot.dto.req;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionFromBankRequestDTO {
    private Integer questionId;
    private Double points;
}
