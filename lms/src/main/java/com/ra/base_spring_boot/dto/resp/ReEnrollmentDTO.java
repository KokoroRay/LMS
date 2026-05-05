package com.ra.base_spring_boot.dto.resp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReEnrollmentDTO {
    private Integer id;
    private Integer studentId;
    private Integer failedCourseGradeId;
    private Integer newClassId;
    private Integer paymentId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String notes;
    private LocalDateTime updatedAt;
    
    // ⭐ THÊM MỚI: Thông tin chi tiết để hỗ trợ cập nhật điểm
    private String studentName;
    private String studentEmail;
    private Integer classId;
    private String className;
    private Integer courseId;
    private String courseName;
    private Double currentExamScore;
    
    // ⭐ LUỒNG MỚI: Thông tin kích hoạt quyền thi lại
    private Integer activatedByAdminId;
    private String activatedByAdminName;
    private LocalDateTime retakeActivatedAt;
}
