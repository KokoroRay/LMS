package com.ra.base_spring_boot.dto.resp;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter @Setter
public class NestedPostResponseDTO {
    private Long topicId;
    private String topicTitle;
    private Boolean topicPinned;
    private List<ForumPostResponseDTO> posts;
}
