package com.ra.base_spring_boot.dto.resp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDTO {
    
    private Integer notificationId;
    private String title;
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private String senderName; // Tên người gửi (thường là Admin)
}