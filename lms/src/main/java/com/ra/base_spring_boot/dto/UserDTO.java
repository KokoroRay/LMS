package com.ra.base_spring_boot.dto;

import com.ra.base_spring_boot.model.constants.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Integer userId;
    private Integer id;
    private String username;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private UserStatus status;
    private String roleName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
