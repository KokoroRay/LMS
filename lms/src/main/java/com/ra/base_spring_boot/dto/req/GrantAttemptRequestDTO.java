package com.ra.base_spring_boot.dto.req;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrantAttemptRequestDTO {
    @NotNull(message = "Student ID cannot be null")
    private Integer studentId;

    @Min(value = 1, message = "Extra attempts must be at least 1")
    private Integer extraAttempts;
}
