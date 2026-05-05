package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.req.BlogPostsDTO;
import com.ra.base_spring_boot.model.BlogPosts;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile; // ✅ thêm import này

import java.util.Optional;

public interface IBlogPostsService {
    Page<BlogPosts> findAll(String keyword, Pageable pageable);

    Page<BlogPosts> findPostsByAuthor(Integer authorId, String keyword, Pageable pageable);

    Optional<BlogPosts> findById(Integer id);

    BlogPosts create(BlogPostsDTO dto, Integer authorId, MultipartFile coverImage);


    BlogPosts updateWithImage(Integer id, BlogPostsDTO dto, Integer authorId, MultipartFile coverImage);

    void delete(Integer id);

    Optional<BlogPosts> findBySlug(String slug);
}
