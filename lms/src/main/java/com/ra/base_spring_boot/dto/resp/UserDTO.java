package com.ra.base_spring_boot.dto.resp;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ra.base_spring_boot.model.constants.Gender;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.model.constants.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Integer  id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private Date dateOfBirth;
    private Gender gender;
    private String avatarUrl;
    private UserStatus status;
    private RoleName roleName;
    private LocalDateTime createdAt;
    private  LocalDateTime updatedAt;


}
