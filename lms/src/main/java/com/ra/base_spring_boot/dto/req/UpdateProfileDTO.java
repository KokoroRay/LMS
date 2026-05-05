package com.ra.base_spring_boot.dto.req;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ra.base_spring_boot.model.constants.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileDTO {
    private String firstName;
    private String lastName;
    private String phone;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private Date dateOfBirth;
    private Gender gender;
    private String avatarUrl;
}
