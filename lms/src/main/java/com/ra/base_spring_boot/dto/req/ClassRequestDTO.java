package com.ra.base_spring_boot.dto.req;

import com.ra.base_spring_boot.model.constants.ClassStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassRequestDTO {
    private Integer categoryId;
    private Set<ClassSubjectAssignmentDTO> assignments;
    private String className;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer capacity;
    private ClassStatus status;
}