package com.ra.base_spring_boot.dto.resp;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportErrorDTO {
    private int rowNumber;
    private String errorMessage;
}