package com.ra.base_spring_boot.dto.req;


import com.ra.base_spring_boot.model.constants.Gender;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.model.constants.UserStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserDTO {

    @NotBlank(message = "user is required")
    private String username;

    @NotBlank(message = "email is required")
    @Email(message = "email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$", 
             message = "Password must contain at least one lowercase letter, one uppercase letter, and one digit")
    private String password;

    private String firstName;
    private  String lastName;
    private String phone;
    private Date dateOfBirth;
    private Gender gender;
    private String avatarUrl;

    @NotNull(message = "role is required")
    private RoleName roleName;





}
