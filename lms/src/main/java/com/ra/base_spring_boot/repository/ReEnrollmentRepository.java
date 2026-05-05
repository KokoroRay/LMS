package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Payment;
import com.ra.base_spring_boot.model.ReEnrollment;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.ReEnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List; //
import java.util.Optional;

public interface ReEnrollmentRepository extends JpaRepository<ReEnrollment, Integer> {
    List<ReEnrollment> findByStudentId(Integer studentId);
    // Nếu 1 payment chỉ gắn với 1 ReEnrollmen
    Optional<ReEnrollment> findByPayment(Payment payment);

    // Nếu 1 payment có thể gắn nhiều ReEnrollment (trường hợp thanh toán nhiều môn cùng 1 payment)
    List<ReEnrollment> findAllByPayment(Payment payment);

    // ⭐ THÊM MỚI: Tìm re-enrollment theo courseGradeId và status
    Optional<ReEnrollment> findByFailedCourseGrade_CourseGradeIdAndStatus(Integer courseGradeId, ReEnrollmentStatus status);

}
