package com.ra.base_spring_boot.dto.resp;

import com.ra.base_spring_boot.model.constants.LeaveStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class LeaveResponseDTO {
    private Integer id;
    private Integer userId;
    private String userFullName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private String attachmentUrl;
    private LeaveStatus status;
    private String approverName;
    private LocalDateTime approvalDate;
    private LocalDateTime createdAt;
}