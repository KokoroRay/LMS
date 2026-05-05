package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.resp.ForumPostResponseDTO;
import com.ra.base_spring_boot.services.IForumEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ForumEventServiceImpl implements IForumEventService {

    private final SimpMessagingTemplate messagingTemplate;

    private String getTopicDestination(Long topicId) {
        return "/topic/forum/" + topicId;
    }

    @Override
    public void broadcastPostCreation(Long topicId, ForumPostResponseDTO post) {
        Map<String, Object> event = new HashMap<>();
        event.put("type", "NEW_POST");
        event.put("payload", post);
        messagingTemplate.convertAndSend(getTopicDestination(topicId), event);
    }

    @Override
    public void broadcastPostUpdate(Long topicId, ForumPostResponseDTO post) {
        Map<String, Object> event = new HashMap<>();
        event.put("type", "UPDATE_POST");
        event.put("payload", post);
        messagingTemplate.convertAndSend(getTopicDestination(topicId), event);
    }

    @Override
    public void broadcastPostDeletion(Long topicId, Long postId) {
        Map<String, Object> event = new HashMap<>();
        event.put("type", "DELETE_POST");
        event.put("payload", Map.of("postId", postId));
        messagingTemplate.convertAndSend(getTopicDestination(topicId), event);
    }

    @Override
    public void broadcastTopicDeletion(Long topicId) {
        log.info("Broadcasting topic deletion for topicId: {}", topicId);
        Map<String, Object> event = new HashMap<>();
        event.put("type", "DELETE_TOPIC");
        event.put("payload", Map.of("topicId", topicId));
        messagingTemplate.convertAndSend(getTopicDestination(topicId), event);
    }
}