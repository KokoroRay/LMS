package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.LessonResource;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LessonResourceRepository extends JpaRepository<LessonResource, Integer> {
    List<LessonResource> findByLessonLessonId(Integer lessonId);
}
