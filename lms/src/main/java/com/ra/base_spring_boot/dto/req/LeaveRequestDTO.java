package com.ra.base_spring_boot.dto.req;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class LeaveRequestDTO {

    @NotNull(message = "Start date must not be null")
    @FutureOrPresent(message = "Start date must be today or in the future")
    private LocalDate startDate;

    @NotNull(message = "End date must not be null")
    private LocalDate endDate;

    @NotBlank(message = "Reason must not be blank")
    @Size(min = 10, max = 500, message = "Reason must be between 10 and 500 characters")
    private String reason;

    private String attachmentUrl;
}