package com.ra.base_spring_boot.dto.resp;

import com.ra.base_spring_boot.model.ForumReport;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter @Getter
public class ForumReportResponseDTO {
    private Long reportId;
    private Long postId;
    private Long topicId;
    private UserInfo reporter;
    private String reason;
    private ForumReport.ReportStatus status;
    private ForumReport.ReportType reportType;
    private LocalDateTime reportedAt;
    private LocalDateTime resolvedAt;
    private UserInfo resolvedBy;
    private String resolutionNote;
    private PostInfo post;
    private TopicInfo topic;
    private String contentLink; // Link to view the reported content

    @Getter @Setter
    public static class UserInfo {
        private Integer userId;
        private String firstName;
        private String lastName;
        private String email;
        private String avatarUrl;
    }

    @Getter @Setter
    public static class PostInfo {
        private Long postId;
        private String content;
        private UserInfo author;
    }

    @Getter @Setter
    public static class TopicInfo {
        private Long topicId;
        private String title;
        private UserInfo author;
    }
}
