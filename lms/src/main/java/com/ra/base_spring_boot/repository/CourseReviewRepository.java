package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.CourseReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseReviewRepository extends JpaRepository<CourseReview, Integer> {
    List<CourseReview> findByCourse_CourseId(Integer courseId);
    List<CourseReview> findByStudent_Id(Integer studentId);
    void deleteAllByCourse_CourseId(Integer courseId);
}
