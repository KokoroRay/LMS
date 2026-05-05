package com.ra.base_spring_boot.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class NotificationRequestDTO {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Message is required")
    private String message;
    
    @NotNull(message = "User IDs are required")
    private List<Integer> userIds;
}