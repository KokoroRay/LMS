// File: ClassSubjectAssignmentDTO.java
package com.ra.base_spring_boot.dto.req;

import lombok.AllArgsConstructor; // <-- QUAN TRỌNG CHO DESERIALIZATION
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor; // <-- QUAN TRỌNG CHO DESERIALIZATION

@Data
@NoArgsConstructor // Cần thiết cho Jackson
@AllArgsConstructor // Cần thiết cho Jackson
@Builder
public class ClassSubjectAssignmentDTO {
    private Integer courseId;
    private Integer teacherId;
}