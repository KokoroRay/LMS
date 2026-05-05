package com.ra.base_spring_boot.dto.req;

import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.PostStatus;
import com.ra.base_spring_boot.model.constants.PostType;
import lombok.*;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class BlogPostsDTO {

    private Integer id; // optional nếu dùng cho update

    private Integer  authorId; // chỉ lưu id, không map entity User trực tiếp

    private String title;

    private String slug;

    private String content;

    private String coverUrl;

    private PostType postType;

    private String videoUrl;

    private PostStatus status;

    private LocalDateTime publishedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
