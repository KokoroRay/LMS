package com.ra.base_spring_boot.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCaseDTO {
    private String input;
    private String expectedOutput;
    private Boolean isHidden;
}
