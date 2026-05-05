package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Submission;
import com.ra.base_spring_boot.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Integer> {

    Optional<Submission> findTopByAssignment_AssignmentIdAndStudent_IdOrderBySubmittedAtDesc(
            Integer assignmentId, Integer studentId
    );

    List<Submission> findByAssignment_AssignmentId(Integer assignmentId);

    List<Submission> findByStudent_Id(Integer studentId);

    List<Submission> findByAssignment_AssignmentIdAndStudent_Id(Integer assignmentId, Integer studentId);

    @Query("SELECT AVG(s.grade) FROM Submission s " +
            "JOIN ClassCourseTeacherAssignment ccta ON s.assignment.course.courseId = ccta.course.courseId " +
            "WHERE s.student.id = :studentId " +
            "AND ccta.classEntity.classId = :classId " +
            "AND s.assignment.course.courseId = :courseId")
    Optional<Double> findAverageGradeByStudentAndClassAndCourse(@Param("studentId") Integer studentId,
                                                                @Param("classId") Integer classId,
                                                                @Param("courseId") Integer courseId);

    @Query("SELECT DISTINCT s.student.id FROM Submission s " +
            "JOIN ClassCourseTeacherAssignment ccta ON s.assignment.course.courseId = ccta.course.courseId " +
            "WHERE ccta.classEntity.classId = :classId")
    List<Integer> findStudentIdsByClass(@Param("classId") Integer classId);

    List<Submission> findByGradedBy(User gradedBy);

    List<Submission> findByIsLateTrue();

    List<Submission> findByStudent_IdAndIsLateTrue(Integer studentId);
    // Lấy submission mới nhất theo student, assignment, class
    Optional<Submission> findTopByAssignment_AssignmentIdAndStudent_IdAndClassEntity_ClassIdOrderBySubmittedAtDesc(
            Integer assignmentId, Integer studentId, Integer classId);

    // Lấy tất cả submission theo class
    List<Submission> findByClassEntity_ClassId(Integer classId);

    Optional<Submission> findTopByAssignment_AssignmentIdAndStudent_IdAndAttemptNumberOrderBySubmittedAtDesc(
            Integer assignmentId, Integer studentId, Integer attemptNumber
    );

}
