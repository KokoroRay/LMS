package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.ForumPostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ForumPostLikeRepository extends JpaRepository<ForumPostLike, Long> {

    Optional<ForumPostLike> findByPost_PostIdAndUser_id(Long postPostId, Integer userId);
    Long countByPost_PostId(Long postId);

    @Modifying
    @Query("DELETE FROM ForumPostLike l WHERE l.post.postId = :postId AND l.user.id = :userId")
    void deleteByPostIdAndUserId(@Param("postId") Long postId, @Param("userId") Integer userId);

    boolean existsByPost_PostIdAndUser_id(Long postPostId, Integer userId);

    @Query("SELECT COUNT(l) FROM ForumPostLike l WHERE l.post.postId = :postId")
    Long getLikeCountByPostId(@Param("postId") Long postId);

    List<ForumPostLike> findAllByPost_PostIdInAndUser_id(Collection<Long> postPostIds, Integer userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ForumPostLike fpl WHERE fpl.post.postId = :postId")
    void deleteAllByPost_PostId(@Param("postId") Long postId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ForumPostLike fpl WHERE fpl.post.postId IN :postIds")
    void deleteAllByPost_PostIdIn(@Param("postIds") List<Long> postIds);
}