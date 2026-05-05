package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Builder
@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "forum_topics")
public class ForumTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "topic_id")
    private Long topicId;

    @Column(length = 50)
    private String categoryTag;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Builder.Default
    private Boolean pinned = false;

    @Builder.Default
    @Column(name = "view_count")
    private Long viewCount = 0L;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("createdAt ASC")
    private List<ForumPost> posts = new ArrayList<>();

    @Transient
    private Long postCount;

    @Transient
    private LocalDateTime lastActivityAt;
}