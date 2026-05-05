package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.req.CreatePostRequestDTO;
import com.ra.base_spring_boot.dto.req.ForumSearchRequestDTO;
import com.ra.base_spring_boot.dto.req.CreateTopicRequestDTO;
import com.ra.base_spring_boot.dto.req.UpdateTopicRequestDTO;
import com.ra.base_spring_boot.dto.resp.ForumPostResponseDTO;
import com.ra.base_spring_boot.dto.resp.ForumSearchResultDTO;
import com.ra.base_spring_boot.dto.resp.ForumTopicResponseDTO;
import com.ra.base_spring_boot.dto.resp.NestedPostResponseDTO;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.IForumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/forum")
@RequiredArgsConstructor
public class ForumController {

    private final IForumService forumService;

    @PostMapping("/topics")
    public ResponseEntity<ResponseWrapper<ForumTopicResponseDTO>> createTopic(
            @Valid @RequestBody CreateTopicRequestDTO request,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        User user = userDetails.getUser();
        return ResponseEntity.ok(ResponseWrapper.<ForumTopicResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Create topic successfully")
                .data(forumService.createTopic(request, user))
                .build());
    }


    @PutMapping("/topics/{topicId}")
    public ResponseEntity<ResponseWrapper<ForumTopicResponseDTO>> updateTopic(
            @PathVariable Long topicId,
            @Valid @RequestBody UpdateTopicRequestDTO request,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        User user = userDetails.getUser();
        return ResponseEntity.ok(ResponseWrapper.<ForumTopicResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Update topic successfully")
                .data(forumService.updateTopic(topicId, request, user))
                .build());
    }

    @GetMapping("/topics/{topicId}")
    public ResponseEntity<ResponseWrapper<ForumTopicResponseDTO>> getTopic(@PathVariable Long topicId) {
        return ResponseEntity.ok(ResponseWrapper.<ForumTopicResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get topic successfully")
                .data(forumService.getTopic(topicId))
                .build());
    }

    @GetMapping("/classes/{classId}/topics")
    public ResponseEntity<ResponseWrapper<Page<ForumTopicResponseDTO>>> getTopicsByClass(
            @PathVariable Integer classId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ResponseWrapper.<Page<ForumTopicResponseDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get topics by class successfully")
                .data(forumService.getTopicsByClass(classId, pageable))
                .build());
    }

    @GetMapping("/topics")
    public ResponseEntity<ResponseWrapper<Page<ForumTopicResponseDTO>>> getAllTopics(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ResponseWrapper.<Page<ForumTopicResponseDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get all topics successfully")
                .data(forumService.getAllTopics(pageable))
                .build());
    }

    @GetMapping("/topics/global")
    public ResponseEntity<ResponseWrapper<Page<ForumTopicResponseDTO>>> getGlobalTopics(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ResponseWrapper.<Page<ForumTopicResponseDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get global topics successfully")
                .data(forumService.getGlobalTopics(pageable))
                .build());
    }

    @PatchMapping("/topics/{topicId}/pin")
    public ResponseEntity<ResponseWrapper<Void>> pinTopic(
            @PathVariable Long topicId,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        User user = userDetails.getUser();
        forumService.pinTopic(topicId, user);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Pin topic successfully")
                .build());
    }

    @GetMapping("/topics/{topicId}/posts/nested")
    public ResponseEntity<ResponseWrapper<ForumTopicResponseDTO>> getTopicWithNestedPosts(
            @PathVariable Long topicId,
            @AuthenticationPrincipal(expression="T(java.util.Optional).ofNullable(#this).orElse(null)") Object userDetails) {
        User currentUser = userDetails instanceof MyUserDetails ? ((MyUserDetails)userDetails).getUser() : null;
        return ResponseEntity.ok(ResponseWrapper.<ForumTopicResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get topic with nested posts successfully")
                .data(forumService.getTopicWithPosts(topicId, currentUser))
                .build());
    }

    @DeleteMapping("/topics/{topicId}")
    public ResponseEntity<ResponseWrapper<Void>> deleteTopic(
            @PathVariable Long topicId,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        User user = userDetails.getUser();
        forumService.deleteTopic(topicId, user);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Delete topic successfully")
                .build());
    }

    @PostMapping("/posts")
    public ResponseEntity<ResponseWrapper<ForumPostResponseDTO>> createPost(
            @Valid @RequestBody CreatePostRequestDTO request,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        User user = userDetails.getUser();
        return ResponseEntity.ok(ResponseWrapper.<ForumPostResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Create post successfully")
                .data(forumService.createPost(request, user))
                .build());
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<ResponseWrapper<ForumPostResponseDTO>> updatePost(
            @PathVariable Long postId,
            @Valid @RequestBody String content,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        User user = userDetails.getUser();
        return ResponseEntity.ok(ResponseWrapper.<ForumPostResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Update post successfully")
                .data(forumService.updatePost(postId, content, user))
                .build());
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<ResponseWrapper<Void>> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        User user = userDetails.getUser();
        forumService.deletePost(postId, user);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Delete post successfully")
                .build());
    }

    @GetMapping("/topics/{topicId}/posts")
    public ResponseEntity<ResponseWrapper<Page<ForumPostResponseDTO>>> getPostsByTopic(
            @PathVariable Long topicId,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(ResponseWrapper.<Page<ForumPostResponseDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get posts by topic successfully")
                .data(forumService.getPostsByTopic(topicId, pageable))
                .build());
    }

    @PatchMapping("/topics/{topicId}/unpin")
    public ResponseEntity<ResponseWrapper<Void>> unpinTopic (
            @PathVariable Long topicId,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        User user = userDetails.getUser();
        forumService.unpinTopic(topicId, user);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Unpin topic successfully")
                .build());
    }

    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<ResponseWrapper<ForumPostResponseDTO>> likePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        User user = userDetails.getUser();
        return ResponseEntity.ok(ResponseWrapper.<ForumPostResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Like post successfully")
                .data(forumService.likePost(postId, user))
                .build());
    }

    @DeleteMapping("/posts/{postId}/like")
    public ResponseEntity<ResponseWrapper<ForumPostResponseDTO>> unlikePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        User user = userDetails.getUser();
        return ResponseEntity.ok(ResponseWrapper.<ForumPostResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Unlike post successfully")
                .data(forumService.unlikePost(postId, user))
                .build());
    }

    @GetMapping("/posts/like-status")
    public ResponseEntity<ResponseWrapper<Map<Long, Boolean>>> getLikeStatus(
            @RequestBody List<Long> postIds,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        User user = userDetails.getUser();
        return ResponseEntity.ok(ResponseWrapper.<Map<Long, Boolean>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get like status successfully")
                .data(forumService.getLikeStatusForPosts(postIds, user))
                .build());
    }

    @GetMapping("/search")
    public ResponseEntity<ResponseWrapper<Page<ForumSearchResultDTO>>> searchForum(
            @RequestParam String keyword,
            @RequestParam(required = false) Long classId,
            @RequestParam(defaultValue = "ALL") ForumSearchRequestDTO.SearchType searchType,
            @RequestParam(required = false) String authorName,
            @RequestParam(required = false) Boolean pinned,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal(expression="T(java.util.Optional).ofNullable(#this).orElse(null)") Object userDetails) {
        User currentUser = userDetails instanceof MyUserDetails ? ((MyUserDetails)userDetails).getUser() : null;
        ForumSearchRequestDTO request = new ForumSearchRequestDTO();
        request.setKeyword(keyword);
        request.setClassId(classId);
        request.setSearchType(searchType);
        request.setAuthorName(authorName);
        request.setPinned(pinned);
        request.setPageable(pageable);
        return ResponseEntity.ok(ResponseWrapper.<Page<ForumSearchResultDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Search forum successfully")
                .data(forumService.searchForum(request, currentUser))
                .build());
    }
}
