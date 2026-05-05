package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.req.LeaveRequestDTO;
import com.ra.base_spring_boot.dto.resp.LeaveResponseDTO;
import com.ra.base_spring_boot.exception.HttpBadRequest;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.model.LeaveRequest;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.LeaveStatus;
import com.ra.base_spring_boot.repository.ILeaveRequestRepository;
import com.ra.base_spring_boot.repository.IUserRepository;
import com.ra.base_spring_boot.services.IAuthService;
import com.ra.base_spring_boot.services.ILeaveRequestService;
import com.ra.base_spring_boot.services.NotificationService;
import com.ra.base_spring_boot.model.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LeaveRequestServiceImpl implements ILeaveRequestService {

    private final ILeaveRequestRepository leaveRequestRepository;
    private final IUserRepository userRepository;
    private final IAuthService authService;
    private final NotificationService notificationService;

    private User getCurrentUserEntity() {
        return authService.getCurrentUserEntity();
    }

    private LeaveResponseDTO convertToResponseDTO(LeaveRequest request) {
        return LeaveResponseDTO.builder()
                .id(request.getId())
                .userId(request.getUser().getId())
                .userFullName(request.getUser().getFullName())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .reason(request.getReason())
                .attachmentUrl(request.getAttachmentUrl())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .approverName(request.getApprover() != null ? request.getApprover().getFullName() : null)
                .approvalDate(request.getApprovalDate())
                .build();
    }


    @Override
    @Transactional
    public LeaveResponseDTO createLeaveRequest(LeaveRequestDTO requestDTO) {
        User currentUser = getCurrentUserEntity();

        if (requestDTO.getStartDate().isAfter(requestDTO.getEndDate())) {
            throw new HttpBadRequest("Start date cannot be after end date.");
        }

        LeaveRequest newRequest = LeaveRequest.builder()
                .user(currentUser)
                .startDate(requestDTO.getStartDate())
                .endDate(requestDTO.getEndDate())
                .reason(requestDTO.getReason())
                .attachmentUrl(requestDTO.getAttachmentUrl())
                .status(LeaveStatus.PENDING)
                .build();

        LeaveRequest savedRequest = leaveRequestRepository.save(newRequest);
        return convertToResponseDTO(savedRequest);
    }

    @Override
    public Page<LeaveResponseDTO> getMyLeaveRequests(Pageable pageable, String status) {
        User currentUser = getCurrentUserEntity();
        Integer userId = currentUser.getId();

        if ("all".equalsIgnoreCase(status) || status == null || status.isEmpty()) {
            return leaveRequestRepository
                    .findByUserId(userId, pageable)
                    .map(this::convertToResponseDTO);
        }

        try {
            LeaveStatus leaveStatus = LeaveStatus.valueOf(status.toUpperCase());

            return leaveRequestRepository
                    .findByUserIdAndStatus(userId, leaveStatus, pageable)
                    .map(this::convertToResponseDTO);

        } catch (IllegalArgumentException e) {
            throw new HttpBadRequest("Invalid leave request status: " + status);
        }
    }

    @Override
    public Page<LeaveResponseDTO> getAllLeaveRequests(String status, Pageable pageable) {
        LeaveStatus leaveStatus = LeaveStatus.PENDING;

        if (status != null && !status.isEmpty()) {
            try {
                leaveStatus = LeaveStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new HttpBadRequest("Invalid leave request status: " + status);
            }
        }

        return leaveRequestRepository
                .findByStatusOrderByCreatedAtAsc(leaveStatus, pageable)
                .map(this::convertToResponseDTO);
    }

    @Override
    @Transactional
    public LeaveResponseDTO approveLeaveRequest(Integer requestId) {
        User approver = getCurrentUserEntity();
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new HttpNotFound("Leave Request not found with ID: " + requestId));

        if (request.getStatus() != LeaveStatus.PENDING) {
            throw new HttpBadRequest("Only PENDING requests can be approved.");
        }

        request.setStatus(LeaveStatus.APPROVED);
        request.setApprover(approver);
        request.setApprovalDate(LocalDateTime.now());

        LeaveRequest updatedRequest = leaveRequestRepository.save(request);
        
        // Gửi thông báo cho người nộp đơn
        String title = "Đơn xin nghỉ được duyệt";
        String message = String.format("Đơn xin nghỉ từ %s đến %s đã được duyệt bởi %s", 
                request.getStartDate(), request.getEndDate(), approver.getFullName());
        Notification notification = notificationService.createNotification(
                request.getUser().getId(), title, message);
        notificationService.sendNotificationToUser(request.getUser().getId(), notification);
        
        return convertToResponseDTO(updatedRequest);
    }

    @Override
    @Transactional
    public LeaveResponseDTO rejectLeaveRequest(Integer requestId) {
        User approver = getCurrentUserEntity();
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new HttpNotFound("Leave Request not found with ID: " + requestId));

        if (request.getStatus() != LeaveStatus.PENDING) {
            throw new HttpBadRequest("Only PENDING requests can be rejected.");
        }

        request.setStatus(LeaveStatus.REJECTED);
        request.setApprover(approver);
        request.setApprovalDate(LocalDateTime.now());

        LeaveRequest updatedRequest = leaveRequestRepository.save(request);
        
        // Gửi thông báo cho người nộp đơn
        String title = "Đơn xin nghỉ bị từ chối";
        String message = String.format("Đơn xin nghỉ từ %s đến %s đã bị từ chối bởi %s", 
                request.getStartDate(), request.getEndDate(), approver.getFullName());
        Notification notification = notificationService.createNotification(
                request.getUser().getId(), title, message);
        notificationService.sendNotificationToUser(request.getUser().getId(), notification);
        
        return convertToResponseDTO(updatedRequest);
    }
}