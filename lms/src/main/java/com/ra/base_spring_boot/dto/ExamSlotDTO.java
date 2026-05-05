package com.ra.base_spring_boot.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSlotDTO {
    private Integer slotId;
    private LocalDateTime slotTime;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private LocalDateTime createdAt;
}