package com.ra.base_spring_boot.dto.resp;


import com.ra.base_spring_boot.model.constants.Gender;
import com.ra.base_spring_boot.model.constants.UserStatus;
import lombok.Data;

import java.util.Date;

@Data
public class StudentResponseDTO {

    private Integer userId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private Date dateOfBirth;
    private Gender gender;
    private String avatarUrl;
    private UserStatus status;

    private String studentCode;
    private String className;
    private String address;
    private String city;
    private String country;
    private String occupation;
    private String bio;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;

}
