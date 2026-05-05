package com.ra.base_spring_boot.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CreatePostRequestDTO {

    @NotNull(message = "Topic ID is required")
    private Long topicId;

    private Long parentPostId;

    @NotBlank(message = "Content is required")
    private String content;

}
