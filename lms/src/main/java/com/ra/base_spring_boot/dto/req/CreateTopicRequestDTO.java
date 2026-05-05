package com.ra.base_spring_boot.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Setter @Getter
public class CreateTopicRequestDTO {
    private Integer classId; // Optional - null means global topic

    private String categoryTag;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;
}
