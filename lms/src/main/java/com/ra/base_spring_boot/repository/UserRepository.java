package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Role;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    List<User> findByRole(Role role);

    List<User> findByRoleAndStatus(Role role, UserStatus status);

    @Query("SELECT u FROM User u WHERE u.role.id = :roleId")
    List<User> findByRoleId(@Param("roleId") Integer roleId);

    @Query("SELECT u FROM User u WHERE u.role.id = 2 AND u.status = 'ACTIVE'")
    List<User> findAllActiveTeachers();

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END " +
            "FROM User u WHERE u.id = :userId AND u.role.id = 2")
    boolean isTeacher(@Param("userId") Integer userId);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    @Query("SELECT e.student FROM Enrollment e " +
            "WHERE e.classEntity.classId = :classId AND e.status = 'ACTIVE'")
    List<User> findStudentsByClassId(@Param("classId") Integer classId);

    @Query("SELECT DISTINCT e.student " +
            "FROM Enrollment e " +
            "JOIN ClassCourseTeacherAssignment ccta ON e.classEntity.classId = ccta.classEntity.classId " +
            "WHERE ccta.course.courseId = :courseId AND e.status = 'ACTIVE'")
    List<User> findStudentsByCourseId(@Param("courseId") Integer courseId);
}
