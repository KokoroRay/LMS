package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.req.CourseReviewRequestDTO;
import com.ra.base_spring_boot.model.CourseReview;
import com.ra.base_spring_boot.repository.CourseReviewRepository;
import com.ra.base_spring_boot.repository.CourseRepository;
import com.ra.base_spring_boot.repository.UserRepository;
import com.ra.base_spring_boot.services.CourseReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseReviewServiceImpl implements CourseReviewService {

    private final CourseReviewRepository reviewRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    @Override
    public CourseReview addReview(CourseReviewRequestDTO dto) {
        CourseReview review = new CourseReview();
        review.setCourse(courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course not found")));
        review.setStudent(userRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student not found")));
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setCreatedAt(LocalDateTime.now());

        return reviewRepository.save(review);
    }

    @Override
    public CourseReview updateReview(Integer reviewId, CourseReviewRequestDTO dto) {
        CourseReview existing = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (dto.getRating() != null) existing.setRating(dto.getRating());
        if (dto.getComment() != null) existing.setComment(dto.getComment());

        return reviewRepository.save(existing);
    }

    @Override
    public void deleteReview(Integer reviewId) {
        if (!reviewRepository.existsById(reviewId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found");
        }
        reviewRepository.deleteById(reviewId);
    }

    @Override
    public List<CourseReview> getReviewsByCourse(Integer courseId) {
        return reviewRepository.findByCourse_CourseId(courseId);
    }

    @Override
    public List<CourseReview> getReviewsByStudent(Integer studentId) {
        return reviewRepository.findByStudent_Id(studentId);
    }
}
