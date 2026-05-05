package com.ra.base_spring_boot.dto.resp;

import lombok.*;
import java.util.List;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportResultDTO {
    private int successCount;
    private int errorCount;
    private List<ImportErrorDTO> errors;
}