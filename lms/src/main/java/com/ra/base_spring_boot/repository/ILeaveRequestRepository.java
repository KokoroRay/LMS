package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.LeaveRequest;
import com.ra.base_spring_boot.model.constants.LeaveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ILeaveRequestRepository extends JpaRepository<LeaveRequest, Integer> {

    Page<LeaveRequest> findByUserId(Integer userId, Pageable pageable);

    Page<LeaveRequest> findByUserIdAndStatus(
            Integer userId, LeaveStatus status, Pageable pageable);

    Page<LeaveRequest> findByStatusOrderByCreatedAtAsc(LeaveStatus status, Pageable pageable);
    List<LeaveRequest> findByStatus(LeaveStatus status);
}