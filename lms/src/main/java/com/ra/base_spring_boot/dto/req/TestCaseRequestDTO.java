package com.ra.base_spring_boot.dto.req;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCaseRequestDTO {
    private String input;
    private String expectedOutput;
    private Boolean isHidden;
}
