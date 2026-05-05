package com.ra.base_spring_boot.dto.req;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentRequestDTO {
//    private Integer classId;
    private Integer sessionId;
    private Integer referenceLessonId;
    private String title;
    private String description;
    private LocalDateTime postedAt;
    private LocalDateTime dueDate;
    private BigDecimal maxScore;
    private Boolean allowLate;

}
