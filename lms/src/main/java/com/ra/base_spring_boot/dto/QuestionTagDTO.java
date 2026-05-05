package com.ra.base_spring_boot.dto;


import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Setter @Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionTagDTO {

    private Integer tagId;

    @NotBlank(message = "Tag name is required")
    private String tagName;

    private String description;
}
