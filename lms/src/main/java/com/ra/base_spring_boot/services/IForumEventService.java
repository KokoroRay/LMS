package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.resp.ForumPostResponseDTO;

public interface IForumEventService {
    void broadcastPostCreation(Long topicId, ForumPostResponseDTO post);
    void broadcastPostUpdate(Long topicId, ForumPostResponseDTO post);
    void broadcastPostDeletion(Long topicId, Long postId);
    // [NEW] Thêm hàm này để báo cho FE biết Topic đã bị xóa
    void broadcastTopicDeletion(Long topicId);
}