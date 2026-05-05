package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.req.BlogPostsDTO;
import com.ra.base_spring_boot.model.BlogPosts;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.repository.IBlogPostsRepository;
import com.ra.base_spring_boot.repository.IUserRepository;
import com.ra.base_spring_boot.services.CloudinaryService;
import com.ra.base_spring_boot.services.IBlogPostsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BlogPostsServiceImpl implements IBlogPostsService {

    private final IBlogPostsRepository blogPostsRepository;
    private final IUserRepository userRepository;
    private final CloudinaryService cloudinaryService;


    @Override
    public Page<BlogPosts> findAll(String keyword, Pageable pageable) {
        return blogPostsRepository.search(keyword, pageable);
    }

    @Override
    public Optional<BlogPosts> findById(Integer id) {
        return blogPostsRepository.findById(id);
    }

    @Override
    public Page<BlogPosts> findPostsByAuthor(Integer authorId, String keyword, Pageable pageable) {
        // No need to fetch the User object here if we only need the ID for the repository query
        // User author = userRepository.findById(authorId)
        //         .orElseThrow(() -> new RuntimeException("Author not found"));
        return blogPostsRepository.findByAuthorAndKeyword(authorId, keyword, pageable);
    }


    @Override
    public BlogPosts create(BlogPostsDTO dto, Integer authorId, MultipartFile coverImage) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found"));

        String imageUrl = null;
        if (coverImage != null && !coverImage.isEmpty()) {
            try {
                imageUrl = cloudinaryService.uploadImage(coverImage);
            } catch (IOException e) {
                // Tùy bạn chọn exception domain (BadRequest/Internal). Dùng Runtime cho nhanh:
                throw new RuntimeException("Upload ảnh thất bại: " + e.getMessage(), e);
                // hoặc: throw new HttpBadRequest("Upload ảnh thất bại: " + e.getMessage());
            }
        }

        BlogPosts post = BlogPosts.builder()
                .author(author)
                .title(dto.getTitle())
                .slug(dto.getSlug())
                .content(dto.getContent())
                .coverUrl(imageUrl)
                .postType(dto.getPostType())
                .videoUrl(dto.getVideoUrl())
                .status(dto.getStatus())
                .publishedAt(LocalDateTime.now())
                .build();

        return blogPostsRepository.save(post);
    }

    @Override
    public BlogPosts updateWithImage(Integer id, BlogPostsDTO dto, Integer authorId, MultipartFile coverImage) {
        BlogPosts post = blogPostsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("You are not allowed to update this post");
        }

        post.setTitle(dto.getTitle());
        post.setSlug(dto.getSlug());
        post.setContent(dto.getContent());
        post.setPostType(dto.getPostType());
        post.setVideoUrl(dto.getVideoUrl());
        post.setStatus(dto.getStatus());

        if (coverImage != null && !coverImage.isEmpty()) {
            try {
                String imageUrl = cloudinaryService.uploadImage(coverImage);
                post.setCoverUrl(imageUrl);
            } catch (IOException e) {
                throw new RuntimeException("Upload ảnh thất bại: " + e.getMessage(), e);
            }
        }

        return blogPostsRepository.save(post);
    }


    @Override
    public void delete(Integer id) {
        blogPostsRepository.deleteById(id);
    }

    @Override
    public Optional<BlogPosts> findBySlug(String slug) {
        return Optional.empty();
    }
}
