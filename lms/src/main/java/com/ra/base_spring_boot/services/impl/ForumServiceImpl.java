package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.req.*;
import com.ra.base_spring_boot.dto.resp.*;
import com.ra.base_spring_boot.exception.HttpForbiden;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.mapper.ForumMapper;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.IForumEventService;
import com.ra.base_spring_boot.services.IForumService;
import com.ra.base_spring_boot.services.IViewTrackingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForumServiceImpl implements IForumService {

    private final ForumTopicRepository forumTopicRepository;
    private final ForumPostRepository forumPostRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final ForumMapper forumMapper;
    private final ForumPostLikeRepository forumPostLikeRepository;
    private final IViewTrackingService viewTrackingService;
    private final IForumEventService forumEventService;
    private final ForumReportRepository forumReportRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deleteAssignments(ClassEntity classEntity) {}

    // --- Helper Methods ---
    private ForumTopicResponseDTO mapToTopicResponse(ForumTopic topic) {
        ForumTopicResponseDTO dto = forumMapper.toTopicResponse(topic);
        dto.setCategoryTag(
                topic.getCategoryTag() != null && !topic.getCategoryTag().trim().isEmpty()
                        ? topic.getCategoryTag()
                        : "Global"
        );
        dto.setClassName(topic.getClassEntity() != null ? topic.getClassEntity().getClassName() : null);
        dto.setClassId(topic.getClassEntity() != null ? topic.getClassEntity().getClassId() : null);
        return dto;
    }

    private String getUserIdentifier(User currentUser) {
        if (currentUser != null) return "user_" + currentUser.getId();
        try {
            ServletRequestAttributes sra = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = sra.getRequest();
            String remoteAddr = request.getHeader("X-Forwarded-For");
            if (remoteAddr == null || remoteAddr.isEmpty() || "unknown".equalsIgnoreCase(remoteAddr)) {
                remoteAddr = request.getRemoteAddr();
            }
            return "ip_" + remoteAddr;
        } catch (Exception e) {
            return "system_default_id";
        }
    }

    private boolean hasModerationPermission(ClassEntity classEntity, User user) {
        if (user == null) return false;
        if (user.getRole().getRoleName().name().equals("ROLE_ADMIN")) return true;

        return classEntity != null
                && classEntity.getClassCourseTeacherAssignments() != null
                && classEntity.getClassCourseTeacherAssignments().stream()
                .anyMatch(a -> a.getTeacher() != null && a.getTeacher().getId().equals(user.getId()));
    }

    private ForumPostResponseDTO enrichPostResponse(ForumPost post, User currentUser) {
        ForumPostResponseDTO response = forumMapper.toPostResponse(post);
        Long postId = post.getPostId();

        if (currentUser != null) {
            response.setIsAuthor(post.getUser().getId().equals(currentUser.getId()));
            response.setCanModerate(hasModerationPermission(post.getTopic().getClassEntity(), currentUser));
        } else {
            response.setIsAuthor(false);
            response.setCanModerate(false);
        }

        if (postId != null) {
            response.setLikeCount(forumPostLikeRepository.getLikeCountByPostId(postId));
            response.setLikedByCurrentUser(
                    currentUser != null
                            && forumPostLikeRepository.existsByPost_PostIdAndUser_id(postId, currentUser.getId())
            );
        } else {
            response.setLikeCount(0L);
            response.setLikedByCurrentUser(false);
        }

        return response;
    }

    private ForumPostResponseDTO buildNestedPostResponse(ForumPost post, User currentUser) {
        ForumPostResponseDTO postResponse = enrichPostResponse(post, currentUser);
        Long postId = post.getPostId();

        if (postId != null) {
            List<ForumPostResponseDTO> replyResponses =
                    forumPostRepository.findByParentPost_PostIdOrderByCreatedAtAsc(postId)
                            .stream()
                            .map(r -> buildNestedPostResponse(r, currentUser))
                            .collect(Collectors.toList());
            postResponse.setReplies(replyResponses);
        }
        return postResponse;
    }

    // --- HÀM XÓA MẠNH MẼ (FIX LỖI KHÓA NGOẠI) ---
    private void forceDeletePost(Long postId) {
        // 1. Đệ quy xóa các post con (Replies) trước
        List<ForumPost> children = forumPostRepository.findByParentPost_PostIdOrderByCreatedAtAsc(postId);
        for (ForumPost child : children) {
            forceDeletePost(child.getPostId());
        }

        // 2. Xóa Like và Report liên quan, sau đó FLUSH ngay để DB đồng bộ
        forumPostLikeRepository.deleteAllByPost_PostId(postId);
        forumPostLikeRepository.flush();

        forumReportRepository.deleteAllByPost_PostId(postId);
        forumReportRepository.flush();

        // 3. Cuối cùng mới xóa Post chính
        forumPostRepository.deleteById(postId);
        forumPostRepository.flush();
    }

    @Override
    @Transactional
    @CacheEvict(value = {"forumTopics", "allForumTopics", "globalForumTopics"}, allEntries = true)
    public ForumTopicResponseDTO createTopic(CreateTopicRequestDTO request, User user) {
        ClassEntity classEntity = null;
        if (request.getClassId() != null) {
            classEntity = classRepository.findById(request.getClassId())
                    .orElseThrow(() -> new HttpNotFound("Class not found"));
        }

        ForumTopic topic = forumMapper.toEntity(request);
        topic.setCategoryTag(request.getCategoryTag());
        topic.setClassEntity(classEntity);
        topic.setUser(user);
        topic.setViewCount(0L);

        ForumTopic savedTopic = forumTopicRepository.save(topic);
        return mapToTopicResponse(savedTopic);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"forumTopics", "allForumTopics", "globalForumTopics"}, allEntries = true)
    public ForumTopicResponseDTO updateTopic(Long topicId, UpdateTopicRequestDTO request, User user) {
        ForumTopic topic = forumTopicRepository.findById(topicId)
                .orElseThrow(() -> new HttpNotFound("Topic not found " + topicId));

        if (!topic.getUser().getId().equals(user.getId()) && !hasModerationPermission(topic.getClassEntity(), user)) {
            throw new HttpForbiden("Not authorized to update this topic");
        }

        forumMapper.updateTopicFromRequest(request, topic);
        ForumTopic updated = forumTopicRepository.save(topic);

        return mapToTopicResponse(updated);
    }

    @Override
    @Transactional
    public ForumTopicResponseDTO getTopic(Long topicId) {
        ForumTopic topic = forumTopicRepository.findByIdWithUser(topicId)
                .orElseThrow(() -> new HttpNotFound("Topic not found " + topicId));

        String uid = getUserIdentifier(null);
        if (viewTrackingService.shouldIncrementView(topicId, uid)) {
            topic.setViewCount(topic.getViewCount() == null ? 1L : topic.getViewCount() + 1);
            forumTopicRepository.save(topic);
        }

        return mapToTopicResponse(topic);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "forumTopics", key = "#classId + '_' + #pageable.pageNumber")
    public Page<ForumTopicResponseDTO> getTopicsByClass(Integer classId, Pageable pageable) {
        if (!classRepository.existsById(classId)) {
            throw new HttpNotFound("Class not found " + classId);
        }
        return forumTopicRepository.findByClassIdOrderByPinnedAndUpdatedAt(classId, pageable)
                .map(this::mapToTopicResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "allForumTopics", key = "#pageable.pageNumber")
    public Page<ForumTopicResponseDTO> getAllTopics(Pageable pageable) {
        return forumTopicRepository.findAllOrderByPinnedAndUpdatedAt(pageable)
                .map(this::mapToTopicResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "globalForumTopics", key = "#pageable.pageNumber")
    public Page<ForumTopicResponseDTO> getGlobalTopics(Pageable pageable) {
        return forumTopicRepository.findGlobalTopicsOrderByPinnedAndUpdatedAt(pageable)
                .map(this::mapToTopicResponse);
    }

    @Override
    @Transactional
    public ForumTopicResponseDTO getTopicWithPosts(Long topicId, User currentUser) {
        ForumTopic topic = forumTopicRepository.findByIdWithUser(topicId)
                .orElseThrow(() -> new HttpNotFound("Topic not found " + topicId));

        String uid = getUserIdentifier(currentUser);
        if (viewTrackingService.shouldIncrementView(topicId, uid)) {
            topic.setViewCount(topic.getViewCount() == null ? 1L : topic.getViewCount() + 1);
            forumTopicRepository.save(topic);
        }

        List<ForumPostResponseDTO> posts =
                forumPostRepository.findRootPostsByTopicId(topicId)
                        .stream()
                        .map(p -> buildNestedPostResponse(p, currentUser))
                        .collect(Collectors.toList());

        ForumTopicResponseDTO res = mapToTopicResponse(topic);
        res.setContent(topic.getContent());
        res.setPosts(posts);
        return res;
    }

    @Override
    @Transactional
    @CacheEvict(value = {"forumTopics", "allForumTopics", "globalForumTopics"}, allEntries = true)
    public void deleteTopic(Long topicId, User user) {
        ForumTopic topic = forumTopicRepository.findById(topicId)
                .orElseThrow(() -> new HttpNotFound("Topic not found " + topicId));

        if (!topic.getUser().getId().equals(user.getId()) &&
                !hasModerationPermission(topic.getClassEntity(), user)) {
            throw new HttpForbiden("Not authorized to delete this topic");
        }

        // 1. Gửi socket báo topic bị xóa
        forumEventService.broadcastTopicDeletion(topicId);

        // 2. Xóa Posts
        List<ForumPost> posts = forumPostRepository.findByTopic_TopicId(topicId, Pageable.unpaged()).getContent();
        for (ForumPost post : posts) {
            if (post.getParentPost() == null) {
                forceDeletePost(post.getPostId());
            }
        }

        // 3. Clean up tàn dư
        List<Long> remainingIds = forumPostRepository.findByTopic_TopicId(topicId, Pageable.unpaged())
                .map(ForumPost::getPostId).toList();

        if (!remainingIds.isEmpty()) {
            forumPostLikeRepository.deleteAllByPost_PostIdIn(remainingIds);
            forumPostLikeRepository.flush();

            forumReportRepository.deleteAllByPost_PostIdIn(remainingIds);
            forumReportRepository.flush();

            forumPostRepository.deleteAllById(remainingIds);
            forumPostRepository.flush();
        }

        // 4. Xóa Topic Reports
        forumReportRepository.deleteAllByTopic_TopicId(topicId);
        forumReportRepository.flush();

        // 5. Xóa Topic
        forumTopicRepository.delete(topic);
        log.info("Deleted topic {} and all its contents by user {}", topicId, user.getId());
    }

    @Override
    @Transactional
    public void pinTopic(Long topicId, User user) {
        ForumTopic topic = forumTopicRepository.findById(topicId)
                .orElseThrow(() -> new HttpNotFound("Topic not found " + topicId));

        if (!hasModerationPermission(topic.getClassEntity(), user)) {
            throw new HttpForbiden("Not authorized to pin/unpin");
        }

        topic.setPinned(!topic.getPinned());
        forumTopicRepository.save(topic);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"forumTopics", "allForumTopics", "globalForumTopics"}, allEntries = true)
    public ForumPostResponseDTO createPost(CreatePostRequestDTO request, User user) {
        ForumTopic topic = forumTopicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new HttpNotFound("Topic not found " + request));

        ForumPost parentPost = null;
        if (request.getParentPostId() != null) {
            parentPost = forumPostRepository.findById(request.getParentPostId())
                    .orElseThrow(() -> new HttpNotFound("Parent post not found"));
        }

        ForumPost post = forumMapper.toEntity(request);
        post.setTopic(topic);
        post.setUser(user);
        post.setParentPost(parentPost);

        ForumPost saved = forumPostRepository.save(post);

        topic.setUpdatedAt(LocalDateTime.now());
        forumTopicRepository.save(topic);

        ForumPostResponseDTO dto = enrichPostResponse(saved, user);
        forumEventService.broadcastPostCreation(topic.getTopicId(), dto);

        return dto;
    }

    @Override
    @Transactional
    public ForumPostResponseDTO updatePost(Long postId, String content, User user) {
        ForumPost post = forumPostRepository.findByIdWithUser(postId)
                .orElseThrow(() -> new HttpNotFound("Post not found " + postId));

        if (!post.getUser().getId().equals(user.getId()) &&
                !hasModerationPermission(post.getTopic().getClassEntity(), user)) {
            throw new HttpForbiden("Not authorized to edit");
        }

        post.setContent(content);
        post.setEdited(true);

        ForumPost updated = forumPostRepository.save(post);
        ForumPostResponseDTO dto = enrichPostResponse(updated, user);
        forumEventService.broadcastPostUpdate(post.getTopic().getTopicId(), dto);

        return dto;
    }

    @Override
    @Transactional
    @CacheEvict(value = {"forumTopics", "allForumTopics", "globalForumTopics"}, allEntries = true)
    public void deletePost(Long postId, User user) {
        ForumPost post = forumPostRepository.findByIdWithUser(postId)
                .orElseThrow(() -> new HttpNotFound("Post not found " + postId));

        if (!post.getUser().getId().equals(user.getId()) &&
                !hasModerationPermission(post.getTopic().getClassEntity(), user)) {
            throw new HttpForbiden("Not authorized to delete");
        }

        Long topicId = post.getTopic().getTopicId();
        forceDeletePost(postId);
        forumEventService.broadcastPostDeletion(topicId, postId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ForumPostResponseDTO> getPostsByTopic(Long topicId, Pageable pageable) {
        if (!forumTopicRepository.existsById(topicId)) {
            throw new HttpNotFound("Topic not found " + topicId);
        }

        return forumPostRepository.findByTopic_TopicId(topicId, pageable)
                .map(p -> enrichPostResponse(p, null));
    }

    @Override
    @Transactional
    public void unpinTopic(Long topicId, User user) {
        ForumTopic topic = forumTopicRepository.findById(topicId)
                .orElseThrow(() -> new HttpNotFound("Topic not found " + topicId));

        if (!hasModerationPermission(topic.getClassEntity(), user)) {
            throw new HttpForbiden("Not authorized to unpin");
        }

        topic.setPinned(false);
        forumTopicRepository.save(topic);
    }

    @Override
    @Transactional
    public ForumPostResponseDTO likePost(Long postId, User user) {
        ForumPost post = forumPostRepository.findByIdWithUser(postId)
                .orElseThrow(() -> new HttpNotFound("Post not found " + postId));

        if (forumPostLikeRepository.existsByPost_PostIdAndUser_id(postId, user.getId())) {
            throw new HttpForbiden("Already liked");
        }

        forumPostLikeRepository.save(ForumPostLike.builder()
                .post(post)
                .user(user)
                .build());

        ForumPostResponseDTO dto = enrichPostResponse(post, user);
        forumEventService.broadcastPostUpdate(post.getTopic().getTopicId(), dto);

        return dto;
    }

    @Override
    @Transactional
    public ForumPostResponseDTO unlikePost(Long postId, User user) {
        ForumPost post = forumPostRepository.findByIdWithUser(postId)
                .orElseThrow(() -> new HttpNotFound("Post not found " + postId));

        forumPostLikeRepository.deleteByPostIdAndUserId(postId, user.getId());

        ForumPostResponseDTO dto = enrichPostResponse(post, user);
        forumEventService.broadcastPostUpdate(post.getTopic().getTopicId(), dto);

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, Boolean> getLikeStatusForPosts(List<Long> postIds, User user) {
        if (user == null || postIds.isEmpty()) return new HashMap<>();

        Map<Long, Boolean> result = new HashMap<>();
        forumPostLikeRepository.findAllByPost_PostIdInAndUser_id(postIds, user.getId())
                .forEach(like -> result.put(like.getPost().getPostId(), true));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ForumSearchResultDTO> searchForum(ForumSearchRequestDTO request, User currentUser) {
        return switch (request.getSearchType()) {
            case TOPICS -> searchTopics(request, currentUser);
            case POSTS -> searchPosts(request, currentUser);
            case ALL -> searchAll(request, currentUser);
        };
    }

    private Page<ForumSearchResultDTO> searchTopics(ForumSearchRequestDTO request, User currentUser) {
        return forumTopicRepository.searchTopics(
                request.getKeyword(),
                request.getClassId(),
                request.getAuthorName(),
                request.getPinned(),
                request.getPageable()
        ).map(topic -> {
            ForumSearchResultDTO r = new ForumSearchResultDTO();
            r.setResult(mapToTopicResponse(topic));
            r.setType(ForumSearchResultDTO.ResultType.TOPIC);
            r.setScore(calculateRelevanceScore(topic, request.getKeyword()));
            return r;
        });
    }

    private Page<ForumSearchResultDTO> searchPosts(ForumSearchRequestDTO request, User currentUser) {
        return forumPostRepository.searchPosts(
                request.getKeyword(),
                request.getClassId(),
                request.getAuthorName(),
                request.getPageable()
        ).map(post -> {
            ForumSearchResultDTO r = new ForumSearchResultDTO();
            r.setResult(enrichPostResponse(post, currentUser));
            r.setType(ForumSearchResultDTO.ResultType.POST);
            r.setScore(calculateRelevanceScore(post, request.getKeyword()));
            return r;
        });
    }

    private Page<ForumSearchResultDTO> searchAll(ForumSearchRequestDTO request, User currentUser) {
        Page<ForumTopic> topics = forumTopicRepository.searchTopics(
                request.getKeyword(),
                request.getClassId(),
                request.getAuthorName(),
                request.getPinned(),
                request.getPageable()
        );

        Page<ForumPost> posts = forumPostRepository.searchPosts(
                request.getKeyword(),
                request.getClassId(),
                request.getAuthorName(),
                request.getPageable()
        );

        List<ForumSearchResultDTO> combined = new ArrayList<>();

        topics.forEach(topic -> {
            ForumSearchResultDTO r = new ForumSearchResultDTO();
            r.setResult(mapToTopicResponse(topic));
            r.setType(ForumSearchResultDTO.ResultType.TOPIC);
            r.setScore(calculateRelevanceScore(topic, request.getKeyword()));
            combined.add(r);
        });

        posts.forEach(post -> {
            ForumSearchResultDTO r = new ForumSearchResultDTO();
            r.setResult(enrichPostResponse(post, currentUser));
            r.setType(ForumSearchResultDTO.ResultType.POST);
            r.setScore(calculateRelevanceScore(post, request.getKeyword()));
            combined.add(r);
        });

        combined.sort(Comparator.comparingDouble(ForumSearchResultDTO::getScore).reversed());

        return new PageImpl<>(combined, request.getPageable(),
                topics.getTotalElements() + posts.getTotalElements());
    }

    private Double calculateRelevanceScore(ForumTopic topic, String keyword) {
        double score = 0.0;
        if (topic.getTitle().toLowerCase().contains(keyword.toLowerCase())) score += 2.0;
        if (topic.getContent() != null &&
                topic.getContent().toLowerCase().contains(keyword.toLowerCase())) score += 1.0;
        if (Boolean.TRUE.equals(topic.getPinned())) score += 0.5;
        return score;
    }

    private Double calculateRelevanceScore(ForumPost post, String keyword) {
        return post.getContent().toLowerCase().contains(keyword.toLowerCase()) ? 1.0 : 0.0;
    }

    @Override
    @Transactional
    @CacheEvict(value = {"forumTopics", "allForumTopics", "globalForumTopics"}, allEntries = true)
    public void resolveReport(Long reportId, User adminUser, boolean deleteContent) {
        ForumReport report = forumReportRepository.findById(reportId)
                .orElseThrow(() -> new HttpNotFound("Report not found " + reportId));

        if (!adminUser.getRole().getRoleName().name().equals("ROLE_ADMIN")) {
            throw new HttpForbiden("Only administrators can resolve reports.");
        }

        if (deleteContent) {
            // --- LOGIC QUAN TRỌNG ĐÃ SỬA TẠI ĐÂY ---
            // Kiểm tra đối tượng (post/topic) có tồn tại không, thay vì kiểm tra ReportType

            if (report.getPost() != null) {
                // CASE 1: XÓA POST
                Long postId = report.getPost().getPostId();
                Long topicId = report.getTopic() != null ? report.getTopic().getTopicId() : null;

                // Nếu topicId trong report null thì lấy từ post (để gửi socket)
                if (topicId == null && report.getPost().getTopic() != null) {
                    topicId = report.getPost().getTopic().getTopicId();
                }

                // Ngắt quan hệ report
                report.setPost(null);
                report.setStatus(ForumReport.ReportStatus.RESOLVED);
                report.setResolutionNote("Resolved by admin (content deleted)");
                report.setResolvedBy(adminUser);
                report.setResolvedAt(LocalDateTime.now());
                forumReportRepository.saveAndFlush(report);

                // Xóa nội dung
                forceDeletePost(postId);

                if (topicId != null) {
                    forumEventService.broadcastPostDeletion(topicId, postId);
                }
                log.info("Post {} deleted by admin {}", postId, adminUser.getId());

            } else if (report.getTopic() != null) {
                // CASE 2: XÓA TOPIC
                Long topicId = report.getTopic().getTopicId();

                // Ngắt quan hệ report
                report.setTopic(null);
                report.setPost(null);
                report.setStatus(ForumReport.ReportStatus.RESOLVED);
                report.setResolutionNote("Resolved by admin (content deleted)");
                report.setResolvedBy(adminUser);
                report.setResolvedAt(LocalDateTime.now());
                forumReportRepository.saveAndFlush(report);

                // Xóa nội dung
                deleteTopic(topicId, adminUser);
                log.info("Topic {} deleted by admin {}", topicId, adminUser.getId());
            }
        } else {
            // CASE 3: CHỈ RESOLVE, KHÔNG XÓA
            report.setStatus(ForumReport.ReportStatus.RESOLVED);
            report.setResolutionNote("Resolved by admin");
            report.setResolvedBy(adminUser);
            report.setResolvedAt(LocalDateTime.now());
            forumReportRepository.save(report);
        }
    }
}