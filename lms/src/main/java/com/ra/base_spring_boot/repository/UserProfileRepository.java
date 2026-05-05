package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.UserProfile;
import com.ra.base_spring_boot.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Integer> {

    // Tìm profile theo user
    Optional<UserProfile> findByUser(User user);

    // Tìm profile theo teacher code
    Optional<UserProfile> findByTeacherCode(String teacherCode);

    // Tìm profile theo student code
    Optional<UserProfile> findByStudentCode(String studentCode);

    // Kiểm tra tồn tại teacher code
    boolean existsByTeacherCode(String teacherCode);

    // Kiểm tra tồn tại student code
    boolean existsByStudentCode(String studentCode);
}
