package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.BlogPosts;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface IBlogPostsRepository extends JpaRepository<BlogPosts, Integer> {

    @Query("SELECT b FROM BlogPosts b " +
            "WHERE (:keyword IS NULL OR b.title LIKE %:keyword% OR b.content LIKE %:keyword%)")
    Page<BlogPosts> search(String keyword, Pageable pageable);

    @Query("SELECT b FROM BlogPosts b " +
            "WHERE b.author.id = :authorId AND " +
            "(:keyword IS NULL OR b.title LIKE %:keyword% OR b.content LIKE %:keyword%)")
    Page<BlogPosts> findByAuthorAndKeyword(Integer authorId, String keyword, Pageable pageable);

    Optional<BlogPosts> findBySlug(String slug);
}
