package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.base.BaseObject;
import com.ra.base_spring_boot.model.constants.PostStatus;
import com.ra.base_spring_boot.model.constants.PostType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blog_posts")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@AttributeOverride(name = "id", column = @Column(name = "post_id"))
public class BlogPosts extends BaseObject {

    @ManyToOne
    @JoinColumn(name = "author_id", referencedColumnName = "user_id", foreignKey = @ForeignKey(name = "fk_blog_author"))
    private User author;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "slug", unique = true, length = 255)
    private String slug;

    @Lob
    private String content;

    @Column(name = "cover_url", length = 512)
    private String coverUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", length = 20)
    @Builder.Default
    private PostType postType = PostType.FRONT_END;

    @Column(name = "video_url", length = 512)
    private String videoUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private PostStatus status = PostStatus.DRAFT;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

}
