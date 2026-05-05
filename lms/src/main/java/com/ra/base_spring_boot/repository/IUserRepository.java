package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.model.constants.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Optional;

public interface IUserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByResetPasswordToken(String resetPasswordToken);

    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN TRUE ELSE FALSE END " +
            "FROM User u JOIN u.profile p WHERE p.studentCode = :studentCode")
    boolean existsByStudentCode(@Param("studentCode") String studentCode);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN TRUE ELSE FALSE END " +
            "FROM User u JOIN u.profile p WHERE p.teacherCode = :teacherCode")
    boolean existsByTeacherCode(@Param("teacherCode") String teacherCode);

    @Query("SELECT u FROM User u JOIN u.role r WHERE r.roleName = :roleName")
    List<User> findByRoleName(@Param("roleName") RoleName roleName);

    List<User> findByStatus(UserStatus status);
    
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u JOIN u.profile p WHERE p.studentCode = :studentCode")
    Boolean existByStudentCode(@Param("studentCode") String studentCode);

    @Query("SELECT u FROM User u WHERE u.role.id = :roleId " +
            "AND (u.firstName LIKE %:keyword% OR u.lastName LIKE %:keyword% OR u.email LIKE %:keyword%)")
    Page<User> findByRoleAndKeyword(@Param("roleId") Integer roleId,
                                    @Param("keyword") String keyword,
                                    Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role.id = :roleId")
    Page<User> findByRoleId(@Param("roleId") Integer roleId, Pageable pageable);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile WHERE u.email = :email")
    Optional<User> findByEmailWithProfile(@Param("email") String email);
}
