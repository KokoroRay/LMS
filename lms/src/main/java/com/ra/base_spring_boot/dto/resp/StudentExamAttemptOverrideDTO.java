package com.ra.base_spring_boot.dto.resp;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentExamAttemptOverrideDTO {
    private Integer overrideId;
    private Integer studentId;
    private String studentName;
    private Integer examId;
    private String examTitle;
    private Integer extraAttempts;
    private Integer grantedByInstructorId;
    private String grantedByInstructorName;
    private LocalDateTime grantedAt;
}
