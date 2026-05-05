package com.ra.base_spring_boot.dto.resp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCaseResultDTO {
    private Integer id; // ID của test case (nếu có)
    private String input;
    private String expectedOutput;
    private String actualOutput;
    private Boolean isCorrect; // true = Pass (Xanh), false = Fail (Đỏ)
    private Boolean isHidden;
}