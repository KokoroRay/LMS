package com.ra.base_spring_boot.dto.req;

import com.ra.base_spring_boot.model.ForumReport;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CreateReportRequestDTO {
    private Long postId;
    private Long topicId;

    @NotNull(message = "Report type is required")
    private ForumReport.ReportType reportType;

    @NotBlank(message = "Reason is required")
    @Size(min = 1, max = 500, message = "Reason must be between 1 and 500 characters")
    private String reason;
}
