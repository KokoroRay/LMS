package com.ra.base_spring_boot.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ra.base_spring_boot.dto.req.BlogPostsDTO;
import com.ra.base_spring_boot.model.BlogPosts;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.IBlogPostsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; // ✅ thêm import này

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class BlogPostsController {

    private final IBlogPostsService blogPostsService;

    @PreAuthorize("hasAnyRole('MODERATOR')")
    @GetMapping("/my-posts")
    public ResponseEntity<Page<BlogPosts>> getMyPosts(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication
    ) {
        MyUserDetails userDetails = (MyUserDetails) authentication.getPrincipal();
        Integer authorId = userDetails.getId();
        Page<BlogPosts> posts = blogPostsService.findPostsByAuthor(authorId, keyword, PageRequest.of(page, size));
        return ResponseEntity.ok(posts);
    }

    // Danh sách + tìm kiếm + phân trang
    @GetMapping
    public ResponseEntity<Page<BlogPosts>> getAllPosts(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<BlogPosts> posts = blogPostsService.findAll(keyword, PageRequest.of(page, size));
        return ResponseEntity.ok(posts);
    }

    // Xem chi tiết bài viết theo ID (Giữ lại tạm thời nếu cần)
    @GetMapping("/{id}")
    public ResponseEntity<BlogPosts> getPostById(@PathVariable Integer id) {
        return blogPostsService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ THÊM MỚI: Xem chi tiết bài viết theo SLUG
    @GetMapping("/slug/{slug}")
    public ResponseEntity<BlogPosts> getPostBySlug(@PathVariable String slug) {
        return blogPostsService.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Thêm mới bài viết + upload ảnh (Admin hoặc Giảng viên)
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createPost(
            @RequestPart("post") String postJson,
            @RequestPart(value = "coverImage", required = false) MultipartFile coverImage,
            @RequestParam("authorId") Integer authorId
    ) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        BlogPostsDTO dto = objectMapper.readValue(postJson, BlogPostsDTO.class);

        BlogPosts post = blogPostsService.create(dto, authorId, coverImage);
        return ResponseEntity.ok(post);
    }



    // Cập nhật bài viết (Admin hoặc Giảng viên)
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<BlogPosts> updatePost(
            @PathVariable Integer id,
            @RequestPart("post") String postJson,
            @RequestPart(value = "coverImage", required = false) MultipartFile coverImage,
            @RequestParam("authorId") Integer authorId
    ) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        BlogPostsDTO dto = objectMapper.readValue(postJson, BlogPostsDTO.class);

        BlogPosts updated = blogPostsService.updateWithImage(id, dto, authorId, coverImage);
        return ResponseEntity.ok(updated);
    }





    // Xóa bài viết
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Integer id) {
        blogPostsService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
