package com.ra.base_spring_boot.dto.req;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateExamScoreForReEnrollmentDTO {
    
    @NotNull(message = "Student ID không được để trống")
    private Integer studentId;
    
    @NotNull(message = "Class ID không được để trống")
    private Integer classId;
    
    @NotNull(message = "Course ID không được để trống")
    private Integer courseId;
    
    @NotNull(message = "Điểm exam không được để trống")
    @DecimalMin(value = "0.0", message = "Điểm exam phải >= 0")
    @DecimalMax(value = "10.0", message = "Điểm exam phải <= 10")
    private Double examScore;
    
    private String notes; // Ghi chú (tuỳ chọn)
}