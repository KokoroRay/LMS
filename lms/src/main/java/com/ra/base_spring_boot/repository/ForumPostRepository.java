package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.ForumPost;
import com.ra.base_spring_boot.model.ForumTopic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {

    List<ForumPost> findByTopic_TopicIdAndParentPostIsNullOrderByCreatedAtAsc(Long topicId);

    @Query("SELECT fp FROM ForumPost fp WHERE fp.topic.topicId = :topicId AND fp.parentPost IS NULL ORDER BY fp.createdAt ASC")
    List<ForumPost> findRootPostsByTopicId(@Param("topicId") Long topicId);

    List<ForumPost> findByParentPost_PostIdOrderByCreatedAtAsc(Long parentPostId);

    @Query("SELECT fp FROM ForumPost fp JOIN FETCH fp.user WHERE fp.postId = :postId")
    Optional<ForumPost> findByIdWithUser(@Param("postId") Long postId);

    Page<ForumPost> findByTopic_TopicId(Long topicId, Pageable pageable);

    Long countByTopic_TopicId(Long topicId);

    @Query(value = """
    WITH RECURSIVE post_tree AS (
        SELECT p.post_id, p.topic_id, p.user_id, p.parent_post_id,
               p.content, p.created_at, 0 AS depth
        FROM forum_posts p
        WHERE p.topic_id = :topicId AND p.parent_post_id IS NULL
        UNION ALL
        SELECT p.post_id, p.topic_id, p.user_id, p.parent_post_id,
               p.content, p.created_at, pt.depth + 1 AS depth
        FROM forum_posts p
        INNER JOIN post_tree pt ON p.parent_post_id = pt.post_id
    )
    SELECT post_id, topic_id, user_id, parent_post_id,
           content, created_at
    FROM post_tree
    ORDER BY depth, created_at
""", nativeQuery = true)
    List<ForumPost> findNestedPostsByTopic(@Param("topicId") Long topicId);

    @Query("SELECT fp FROM ForumPost fp " +
            "JOIN fp.user u " +
            "JOIN fp.topic t " +
            "JOIN t.classEntity c " +
            "WHERE (:keyword IS NULL OR fp.content LIKE %:keyword%) " +
            "AND (:classId IS NULL OR c.classId = :classId) " +
            "AND (:authorName IS NULL OR CONCAT(u.firstName, ' ', u.lastName) LIKE %:authorName%) " +
            "ORDER BY fp.createdAt DESC")
    Page<ForumPost> searchPosts(
            @Param("keyword") String keyword,
            @Param("classId") Long classId,
            @Param("authorName") String authorName,
            Pageable pageable);
}
