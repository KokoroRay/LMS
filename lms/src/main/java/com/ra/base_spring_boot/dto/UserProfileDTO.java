package com.ra.base_spring_boot.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.model.constants.UserStatus;
import lombok.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private Integer userId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String avatarUrl;
    private UserStatus status;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private Date dateOfBirth;

    private String teacherCode;
    private String studentCode;
    private RoleName roleName;

    private String className;
    private String address;
    private String city;
    private String country;
    private String occupation;
    private String bio;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLogin;
}
