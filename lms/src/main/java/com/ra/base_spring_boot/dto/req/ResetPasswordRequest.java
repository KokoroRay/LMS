package com.ra.base_spring_boot.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Reset token must not be blank")
    private String token;

    @NotBlank(message = "New password must not be blank")
    @Size(min = 8, message = "New password must be at least 8 characters long")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
            message = "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    private String newPassword;

    @NotBlank(message = "Confirm password must not be blank")
    private String confirmPassword;
}