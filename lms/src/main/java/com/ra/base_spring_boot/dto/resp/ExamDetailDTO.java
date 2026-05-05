package com.ra.base_spring_boot.dto.resp;

import com.ra.base_spring_boot.dto.ExamDTO;
import lombok.*;


@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamDetailDTO {
    private ExamDTO exam;
    private Boolean canAttempt;
    private String reason;
    private Integer remainingAttempts;
}
