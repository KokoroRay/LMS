package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Payment;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    List<Payment> findByStudentId(Integer studentId);
    List<Payment> findByStudent(User student);
    Optional<Payment> findByTransactionRef(String transactionRef);
}
