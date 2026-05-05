package com.ra.base_spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryGradeDTO {

    private Integer id;              // categoryGradeId
    private String studentName;      // student's full name
    private String categoryName;     // course category name
    private String className;        // class name
    private Double averageScore;     // average score
    private String status;           // PASS/FAIL
}
