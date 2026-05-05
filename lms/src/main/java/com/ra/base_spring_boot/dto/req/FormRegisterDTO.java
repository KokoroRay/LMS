package com.ra.base_spring_boot.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class FormRegisterDTO
{
    @NotBlank(message = "Cannot be left blank")
    private String firstName;
    @NotBlank(message = "Cannot be left blank")
    private String lastName;
    @NotBlank(message = "Cannot be left blank")
    private String username;
    @NotBlank(message = "Cannot be left black")
    private String email;
    @NotBlank(message = "Cannot be left blank")
    private String password;
}
