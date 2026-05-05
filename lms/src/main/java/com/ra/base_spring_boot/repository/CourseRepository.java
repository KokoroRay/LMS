package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Course;
import com.ra.base_spring_boot.model.CourseCategory;
import com.ra.base_spring_boot.model.constants.CourseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {

    boolean existsByTitle(String title);
    boolean existsBySlug(String slug);
    boolean existsByTitleAndCourseIdNot(String title, Integer courseId);

    List<Course> findByStatusAndTitleContainingIgnoreCase(CourseStatus status, String title);

    List<Course> findByStatus(CourseStatus status);

    List<Course> findByCategory_CategoryId(Integer categoryId);

    List<Course> findByCategory_CategoryIdIn(List<Integer> categoryIds);

    long countByCategory_CategoryId(Integer categoryId);

    List<Course> findByCategory(CourseCategory category);

    @Query("SELECT DISTINCT c FROM Course c " +
            "JOIN c.classAssignments a " +
            "WHERE a.classEntity.classId = :classId AND a.teacher.id = :teacherId")
    List<Course> findCoursesByClassAndTeacher(
            @Param("classId") Integer classId,
            @Param("teacherId") Integer teacherId
    );
}
