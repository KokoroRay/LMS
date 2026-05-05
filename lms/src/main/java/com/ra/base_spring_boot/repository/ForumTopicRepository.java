package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.ForumTopic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ForumTopicRepository extends JpaRepository<ForumTopic, Long> {

    @Query("SELECT ft FROM ForumTopic ft WHERE ft.classEntity.classId = :classId ORDER BY ft.pinned DESC, ft.updatedAt DESC")
    Page<ForumTopic> findByClassIdOrderByPinnedAndUpdatedAt(@Param("classId") Integer classId, Pageable pageable);

    @Query("SELECT ft FROM ForumTopic ft JOIN FETCH ft.user WHERE ft.topicId = :topicId")
    Optional<ForumTopic> findByIdWithUser(@Param("topicId") Long topicId);

    @Query("SELECT COUNT(fp) FROM ForumPost fp WHERE fp.topic.topicId = :topicId")
    Long countPostsByTopicId(@Param("topicId") Long topicId);

    @Modifying
    @Query("UPDATE ForumTopic ft SET ft.pinned = :pinned WHERE ft.topicId = :topicId")
    void updatePinnedStatus(@Param("topicId") Long topicId, @Param("pinned") Boolean pinned);

    @Query("SELECT ft FROM ForumTopic ft " +
            "LEFT JOIN ft.classEntity c " +
            "JOIN ft.user u " +
            "WHERE (:keyword IS NULL OR ft.title LIKE %:keyword% OR ft.content LIKE %:keyword%) " +
            "AND (:classId IS NULL OR c.classId = :classId) " +
            "AND (:authorName IS NULL OR CONCAT(u.firstName, ' ', u.lastName) LIKE %:authorName%) " +
            "AND (:pinned IS NULL OR ft.pinned = :pinned) " +
            "ORDER BY ft.pinned DESC, ft.updatedAt DESC")
    Page<ForumTopic> searchTopics(
            @Param("keyword") String keyword,
            @Param("classId") Long classId,
            @Param("authorName") String authorName,
            @Param("pinned") Boolean pinned,
            Pageable pageable);

    @Query("SELECT ft FROM ForumTopic ft ORDER BY ft.pinned DESC, ft.updatedAt DESC")
    Page<ForumTopic> findAllOrderByPinnedAndUpdatedAt(Pageable pageable);

    @Query("SELECT ft FROM ForumTopic ft WHERE ft.classEntity IS NULL ORDER BY ft.pinned DESC, ft.updatedAt DESC")
    Page<ForumTopic> findGlobalTopicsOrderByPinnedAndUpdatedAt(Pageable pageable);
}