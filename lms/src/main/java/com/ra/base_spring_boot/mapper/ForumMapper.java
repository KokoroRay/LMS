package com.ra.base_spring_boot.mapper;

import com.ra.base_spring_boot.dto.req.CreatePostRequestDTO;
import com.ra.base_spring_boot.dto.req.CreateTopicRequestDTO;
import com.ra.base_spring_boot.dto.req.UpdateTopicRequestDTO;
import com.ra.base_spring_boot.dto.resp.ForumPostResponseDTO;
import com.ra.base_spring_boot.dto.resp.ForumTopicResponseDTO;
import com.ra.base_spring_boot.dto.resp.NestedPostResponseDTO;
import com.ra.base_spring_boot.model.ForumPost;
import com.ra.base_spring_boot.model.ForumTopic;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface ForumMapper {
    @Mapping(target = "classEntity", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "pinned", constant = "false")
    ForumTopic toEntity(CreateTopicRequestDTO request);

    @Mapping(target = "classId", source = "classEntity.classId")
    @Mapping(target = "className", source = "classEntity.className")
    @Mapping(target = "author", source = "user")
    @Mapping(target = "postCount", expression = "java(topic.getPosts() != null ? (long) topic.getPosts().size() : 0L)")
    @Mapping(target = "lastActivityAt", source = "updatedAt")
    ForumTopicResponseDTO toTopicResponse(ForumTopic topic);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "topicId", ignore = true)
    @Mapping(target = "classEntity", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "pinned", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateTopicFromRequest(UpdateTopicRequestDTO request, @MappingTarget ForumTopic topic);

    // Post Mappings
    @Mapping(target = "topic", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "parentPost", ignore = true)
    @Mapping(target = "edited", constant = "false")
    ForumPost toEntity(CreatePostRequestDTO request);

    @Mapping(target = "topicId", source = "topic.topicId")
    @Mapping(target = "author", source = "user")
    @Mapping(target = "parentPostId", source = "parentPost.postId")
    ForumPostResponseDTO toPostResponse(ForumPost post);

    @Mapping(target = "topicId", source = "topic.topicId")
    @Mapping(target = "topicTitle", source = "topic.title")
    @Mapping(target = "topicPinned", source = "topic.pinned")
    NestedPostResponseDTO toNestedResponse(ForumTopic topic, List<ForumPostResponseDTO> posts);

    List<ForumTopicResponseDTO> toTopicResponseList(List<ForumTopic> topics);
    List<ForumPostResponseDTO> toPostResponseList(List<ForumPost> posts);

}
