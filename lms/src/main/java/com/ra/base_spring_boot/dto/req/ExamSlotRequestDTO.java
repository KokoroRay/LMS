package com.ra.base_spring_boot.dto.req;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExamSlotRequestDTO {
    private LocalDateTime slotTime;
    private Integer maxParticipants;
    private Integer slotId;
}