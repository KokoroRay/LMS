package com.ra.base_spring_boot.dto.req;


import com.ra.base_spring_boot.model.constants.Gender;
import com.ra.base_spring_boot.model.constants.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Date;

@Data
public class StudentRequestDTO {

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
    private String userName;

    private String firstName;
    private  String lastName;
    private String phone;
    private Date dateOfBirth;
    private Gender gender;


    private String studentCode;
    private String className;
    private String address;
    private String country;
    private String city;
    private String occupation;
    private String bio;
    private String avatarUrl;
    private UserStatus status;
}
