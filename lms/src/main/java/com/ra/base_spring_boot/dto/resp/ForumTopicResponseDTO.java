package com.ra.base_spring_boot.dto.resp;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Setter @Getter
public class ForumTopicResponseDTO {
    private Long topicId;
    private Integer classId;
    private String className;
    private UserInfo author;
    private String title;
    private String content;
    private String categoryTag;
    private Boolean pinned;
    private Long postCount;
    private Long viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastActivityAt;
    private List<ForumPostResponseDTO> posts;

    @Getter @Setter
    public static class UserInfo {
        private Long userId;
        private String firstName;
        private String lastName;
        private String email;
        private String avatarUrl;
    }
}