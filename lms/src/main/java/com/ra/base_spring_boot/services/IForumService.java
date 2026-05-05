package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.req.CreatePostRequestDTO;
import com.ra.base_spring_boot.dto.req.CreateTopicRequestDTO;
import com.ra.base_spring_boot.dto.req.ForumSearchRequestDTO;
import com.ra.base_spring_boot.dto.req.UpdateTopicRequestDTO;
import com.ra.base_spring_boot.dto.resp.ForumPostResponseDTO;
import com.ra.base_spring_boot.dto.resp.ForumSearchResultDTO;
import com.ra.base_spring_boot.dto.resp.ForumTopicResponseDTO;
import com.ra.base_spring_boot.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface IForumService {
    ForumTopicResponseDTO createTopic(CreateTopicRequestDTO request, User user);
    ForumTopicResponseDTO updateTopic(Long topicId, UpdateTopicRequestDTO request, User user);
    ForumTopicResponseDTO getTopic(Long topicId);
    Page<ForumTopicResponseDTO> getTopicsByClass(Integer classId, Pageable pageable);
    Page<ForumTopicResponseDTO> getAllTopics(Pageable pageable);
    Page<ForumTopicResponseDTO> getGlobalTopics(Pageable pageable);

    ForumTopicResponseDTO getTopicWithPosts(Long topicId, User currentUser);

    void deleteTopic(Long topicId, User user);
    void pinTopic(Long topicId, User user);
    void unpinTopic(Long topicId, User user);
    ForumPostResponseDTO createPost(CreatePostRequestDTO request, User user);
    ForumPostResponseDTO updatePost(Long postId, String content, User user);
    void deletePost(Long postId, User user);
    Page<ForumPostResponseDTO> getPostsByTopic(Long topicId, Pageable pageable);
    ForumPostResponseDTO likePost(Long postId, User user);
    ForumPostResponseDTO unlikePost(Long postId, User user);
    Map<Long, Boolean> getLikeStatusForPosts(List<Long> postIds, User user);
    Page<ForumSearchResultDTO> searchForum(ForumSearchRequestDTO request, User currentUser);

    void resolveReport(Long reportId, User adminUser, boolean deleteContent);
}