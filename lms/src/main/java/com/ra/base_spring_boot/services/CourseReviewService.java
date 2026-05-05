package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.model.CourseReview;
import com.ra.base_spring_boot.dto.req.CourseReviewRequestDTO;

import java.util.List;

public interface CourseReviewService {
    CourseReview addReview(CourseReviewRequestDTO dto);
    CourseReview updateReview(Integer reviewId, CourseReviewRequestDTO dto);
    void deleteReview(Integer reviewId);
    List<CourseReview> getReviewsByCourse(Integer courseId);
    List<CourseReview> getReviewsByStudent(Integer studentId);
}
