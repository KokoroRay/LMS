package com.ra.base_spring_boot.dto.req;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "Email must not be blank")
    @Email(message = "Invalid email format")
    private String email;
}