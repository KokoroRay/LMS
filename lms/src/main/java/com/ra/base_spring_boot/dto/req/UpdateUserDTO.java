package com.ra.base_spring_boot.dto.req;


import com.ra.base_spring_boot.model.constants.Gender;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.model.constants.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserDTO {
    private String firstName;
    private String lastName;
    private String phone;
    private Date dateOfBirth;
    private Gender gender;
    private String avatarUrl;
    private UserStatus status;
    private RoleName roleName;
}
