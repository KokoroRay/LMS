package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.resp.LeaveResponseDTO;
import com.ra.base_spring_boot.services.ILeaveRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/leave-requests")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MODERATOR')") // Chỉ Admin và Giảng viên
public class AdminLeaveController {

    private final ILeaveRequestService leaveRequestService;

    /**
     * GET /admin/leave-requests: Lấy tất cả đơn xin nghỉ (mặc định là PENDING), có thể lọc theo status.
     */
    @GetMapping
    public ResponseEntity<ResponseWrapper<Page<LeaveResponseDTO>>> getAllRequests(
            @RequestParam(defaultValue = "PENDING") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // Sorting mặc định theo ngày tạo cũ nhất (Asc) để duyệt đơn ưu tiên đơn cũ
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<LeaveResponseDTO> requests = leaveRequestService.getAllLeaveRequests(status, pageable);

        return ResponseEntity.ok(ResponseWrapper.<Page<LeaveResponseDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Fetched leave requests for management successfully.")
                .data(requests)
                .build());
    }

    /**
     * PATCH /admin/leave-requests/{requestId}/approve: Duyệt đơn.
     */
    @PatchMapping("/{requestId}/approve")
    public ResponseEntity<ResponseWrapper<LeaveResponseDTO>> approveRequest(
            @PathVariable Integer requestId) {

        LeaveResponseDTO response = leaveRequestService.approveLeaveRequest(requestId);

        return ResponseEntity.ok(ResponseWrapper.<LeaveResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Leave request approved successfully.")
                .data(response)
                .build());
    }

    /**
     * PATCH /admin/leave-requests/{requestId}/reject: Từ chối đơn.
     */
    @PatchMapping("/{requestId}/reject")
    public ResponseEntity<ResponseWrapper<LeaveResponseDTO>> rejectRequest(
            @PathVariable Integer requestId) {

        LeaveResponseDTO response = leaveRequestService.rejectLeaveRequest(requestId);

        return ResponseEntity.ok(ResponseWrapper.<LeaveResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Leave request rejected successfully.")
                .data(response)
                .build());
    }
}
