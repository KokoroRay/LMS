package com.ra.base_spring_boot.dto.resp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentInfoDTO {
    private Integer studentId;
    private String studentName;
    private String studentEmail;
    private String studentCode;
}
