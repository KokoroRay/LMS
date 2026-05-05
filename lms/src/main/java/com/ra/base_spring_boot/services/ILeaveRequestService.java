package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.req.LeaveRequestDTO;
import com.ra.base_spring_boot.dto.resp.LeaveResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ILeaveRequestService {

    LeaveResponseDTO createLeaveRequest(LeaveRequestDTO requestDTO);

    Page<LeaveResponseDTO> getMyLeaveRequests(Pageable pageable, String status);

    Page<LeaveResponseDTO> getAllLeaveRequests(String status, Pageable pageable);

    LeaveResponseDTO approveLeaveRequest(Integer requestId);

    LeaveResponseDTO rejectLeaveRequest(Integer requestId);
}