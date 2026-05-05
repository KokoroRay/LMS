package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Certificate;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.CourseCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Integer> {

    List<Certificate> findAllByStudent(User student);

    Certificate findByStudentAndClassEntityAndCategory(
            User student,
            ClassEntity classEntity,
            CourseCategory category
    );


    Optional<Certificate> findByStudent_IdAndClassEntity_ClassIdAndCategory_CategoryId(
            Integer studentId,
            Integer classId,
            Integer categoryId
    );

    boolean existsByStudent_IdAndCategory_CategoryId(Integer studentId, Integer categoryId);

    boolean existsByStudent_IdAndCourse_CourseId(Integer studentId, Integer courseId);

    boolean existsByStudent_IdAndClassEntity_ClassIdAndCategory_CategoryId(
            Integer studentId,
            Integer classId,
            Integer categoryId
    );
}
