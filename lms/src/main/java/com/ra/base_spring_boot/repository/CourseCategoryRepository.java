package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.CourseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CourseCategoryRepository extends JpaRepository<CourseCategory, Integer> {

    boolean existsByName(String name);

    Optional<CourseCategory> findByName(String name);
}
