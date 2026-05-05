package com.ra.base_spring_boot.mapper;

import com.ra.base_spring_boot.dto.req.CreateReportRequestDTO;
import com.ra.base_spring_boot.dto.resp.ForumReportResponseDTO;
import com.ra.base_spring_boot.model.ForumReport;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface ForumReportMapper {
    @Mapping(target = "reportId", ignore = true)
    @Mapping(target = "post", ignore = true)
    @Mapping(target = "topic", ignore = true)
    @Mapping(target = "reporter", ignore = true)
    @Mapping(target = "resolvedBy", ignore = true)
    @Mapping(target = "reportedAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "resolvedAt", ignore = true)
    ForumReport toEntity(CreateReportRequestDTO request);

    @Mapping(target = "postId", source = "post.postId")
    @Mapping(target = "topicId", expression = "java(getTopicId(report))")
    @Mapping(target = "reporter", source = "reporter")
    @Mapping(target = "resolvedBy", source = "resolvedBy")
    @Mapping(target = "contentLink", expression = "java(generateContentLink(report))")
    ForumReportResponseDTO toResponse(ForumReport report);

    default Long getTopicId(ForumReport report) {
        if (report.getPost() != null && report.getPost().getTopic() != null) {
            Long topicId = report.getPost().getTopic().getTopicId();
            return topicId;
        } else if (report.getTopic() != null) {
            Long topicId = report.getTopic().getTopicId();
            return topicId;
        }
        return null;
    }

    default String generateContentLink(ForumReport report) {
        if (report.getPost() != null && report.getPost().getTopic() != null && report.getPost().getTopic().getTopicId() != null && report.getPost().getPostId() != null) {
            return "/forum/topics/" + report.getPost().getTopic().getTopicId() + "/posts/" + report.getPost().getPostId();
        } else if (report.getTopic() != null && report.getTopic().getTopicId() != null) {
            return "/forum/topics/" + report.getTopic().getTopicId();
        }
        return null;
    }
}