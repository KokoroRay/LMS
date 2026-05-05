package com.ra.base_spring_boot.dto.resp;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AssignmentDTO {

    private Integer assignmentId;

    private Integer sessionId;

    private Integer courseId;

    private Integer classId;

    private String title;

    private String description;

    private LocalDateTime postedAt;

    private LocalDateTime dueDate;

    private BigDecimal maxScore;

    private Boolean allowLate;
}
