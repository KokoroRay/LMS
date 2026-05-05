package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Setter @Getter
@Builder @Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "forum_reports")
public class ForumReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reportId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private ForumPost post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private ForumTopic topic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @Column(nullable = false, length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private ReportType reportType;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime reportedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    private LocalDateTime resolvedAt;

    @Column(length = 1000)
    private String resolutionNote;

    public enum ReportStatus {
        PENDING, UNDER_REVIEW, RESOLVED, DISMISSED
    }

    public enum ReportType {
        SPAM, HARASSMENT, INAPPROPRIATE_CONTENT,
        COPYRIGHT_ISSUE, TOPIC, POST, OTHER
    }
}