package com.ra.base_spring_boot.dto.req;

import com.ra.base_spring_boot.model.ForumReport;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UpdateReportRequestDTO {
    @NotNull(message = "Status is required")
    private ForumReport.ReportStatus status;

    private String resolutionNote;
}
