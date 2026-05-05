package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.req.CourseReviewRequestDTO;
import com.ra.base_spring_boot.dto.resp.CourseReviewResponseDTO;
import com.ra.base_spring_boot.model.CourseReview;
import com.ra.base_spring_boot.services.CourseReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class CourseReviewController {

    private final CourseReviewService reviewService;

    // --- POST: Thêm review ---
    @PostMapping
    public ResponseEntity<CourseReviewResponseDTO> addReview(@RequestBody CourseReviewRequestDTO dto) {
        CourseReview review = reviewService.addReview(dto);
        return ResponseEntity.ok(toDTO(review));
    }

    // --- PUT: Cập nhật review ---
    @PutMapping("/{id}")
    public ResponseEntity<CourseReviewResponseDTO> updateReview(@PathVariable("id") Integer id,
                                                                @RequestBody CourseReviewRequestDTO dto) {
        CourseReview updated = reviewService.updateReview(id, dto);
        return ResponseEntity.ok(toDTO(updated));
    }

    // --- DELETE: Xóa review ---
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable("id") Integer id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }

    // --- GET: Lấy review theo course ---
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CourseReviewResponseDTO>> getReviewsByCourse(@PathVariable Integer courseId) {
        List<CourseReviewResponseDTO> reviews = reviewService.getReviewsByCourse(courseId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reviews);
    }

    // --- GET: Lấy review theo student ---
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<CourseReviewResponseDTO>> getReviewsByStudent(@PathVariable Integer studentId) {
        List<CourseReviewResponseDTO> reviews = reviewService.getReviewsByStudent(studentId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reviews);
    }

    // --- Chuyển từ Entity sang DTO ---
    private CourseReviewResponseDTO toDTO(CourseReview review) {
        return CourseReviewResponseDTO.builder()
                .reviewId(review.getReviewId())
                .courseId(review.getCourse().getCourseId())
                .courseTitle(review.getCourse().getTitle())
                .studentId(review.getStudent().getId())
                .studentName(review.getStudent().getUsername())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
