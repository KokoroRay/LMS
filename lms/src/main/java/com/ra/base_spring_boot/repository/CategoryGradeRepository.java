package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.CategoryGrade;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.CourseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CategoryGradeRepository extends JpaRepository<CategoryGrade, Integer> {

    Optional<CategoryGrade> findByStudentAndClassEntityAndCategory(
            User student,
            ClassEntity classEntity,
            CourseCategory category
    );

    List<CategoryGrade> findByStudent_Id(Integer studentId);

    boolean existsByStudent_IdAndClassEntity_ClassIdAndCategory_CategoryId(
            Integer studentId,
            Integer classId,
            Integer categoryId
    );

    Optional<CategoryGrade> findByStudent_IdAndClassEntity_ClassId(
            Integer studentId,
            Integer classId
    );

    List<CategoryGrade> findAllByClassEntity_ClassId(Integer classId);

    @Query("""
                SELECT cg FROM CategoryGrade cg
                JOIN FETCH cg.student
                JOIN FETCH cg.classEntity
                JOIN FETCH cg.category
                WHERE cg.student.id = :studentId
            """)
    List<CategoryGrade> findByStudentIdWithRelations(Integer studentId);
}