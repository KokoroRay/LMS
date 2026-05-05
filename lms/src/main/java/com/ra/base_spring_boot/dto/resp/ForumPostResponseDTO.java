package com.ra.base_spring_boot.dto.resp;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter
public class ForumPostResponseDTO {
    private Long postId;
    private Long topicId;
    private UserInfo author;
    private String content;
    private Long parentPostId;
    private Boolean edited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long likeCount;
    private Boolean likedByCurrentUser;
    private Boolean isAuthor;
    private Boolean canModerate;
    private List<ForumPostResponseDTO> replies = new ArrayList<>();

    @Getter @Setter
    public static class UserInfo {
        private Long userId;
        private String firstName;
        private String lastName;
        private String email;
        private String avatarUrl;
    }
}