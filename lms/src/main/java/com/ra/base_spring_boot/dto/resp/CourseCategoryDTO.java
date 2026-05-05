package com.ra.base_spring_boot.dto.resp;

import lombok.*;

import java.util.List;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseCategoryDTO {
    private Integer categoryId;
    private String name;
    private String description;
    private List<CourseDTO> courses;
    private BigDecimal price;
}
