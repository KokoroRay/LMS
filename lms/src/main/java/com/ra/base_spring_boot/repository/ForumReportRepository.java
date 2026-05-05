package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.ForumReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumReportRepository extends JpaRepository<ForumReport, Long> {

    Page<ForumReport> findByStatus(ForumReport.ReportStatus status, Pageable pageable);

    @Query(value = "SELECT fr.reportId FROM ForumReport fr",
            countQuery = "SELECT count(fr) FROM ForumReport fr")
    Page<Long> findReportIds(Pageable pageable);

    @Query("SELECT fr FROM ForumReport fr " +
            "LEFT JOIN FETCH fr.post p " +
            "LEFT JOIN FETCH fr.topic t " +
            "LEFT JOIN FETCH fr.reporter r " +
            "LEFT JOIN FETCH fr.resolvedBy rb " +
            "WHERE fr.reportId IN :ids")
    List<ForumReport> findAllWithDetailsByIds(@Param("ids") List<Long> ids);

    Long countByStatus(ForumReport.ReportStatus status);

    boolean existsByPost_PostIdAndReporter_id(Long postPostId, Integer reporterId);

    boolean existsByTopic_TopicIdAndReporter_id(Long topicTopicId, Integer reporterId);

    @Query("SELECT fr FROM ForumReport fr " +
            "LEFT JOIN FETCH fr.reporter r " +
            "WHERE (:status IS NULL OR fr.status = :status) " +
            "AND (:reportType IS NULL OR fr.reportType = :reportType) " +
            "AND (:reporterName IS NULL OR CONCAT(r.firstName, ' ', r.lastName) LIKE %:reporterName%) " +
            "ORDER BY fr.reportedAt DESC")
    Page<ForumReport> findByFilters(
            @Param("status") ForumReport.ReportStatus status,
            @Param("reportType") ForumReport.ReportType reportType,
            @Param("reporterName") String reporterName,
            Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ForumReport fr WHERE fr.post.postId = :postId")
    void deleteAllByPost_PostId(@Param("postId") Long postId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ForumReport fr WHERE fr.topic.topicId = :topicId")
    void deleteAllByTopic_TopicId(@Param("topicId") Long topicId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ForumReport fr WHERE fr.post.postId IN :postIds")
    void deleteAllByPost_PostIdIn(@Param("postIds") List<Long> postIds);
}