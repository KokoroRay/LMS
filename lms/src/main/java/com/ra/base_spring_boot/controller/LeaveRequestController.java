package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.req.LeaveRequestDTO;
import com.ra.base_spring_boot.dto.resp.LeaveResponseDTO;
import com.ra.base_spring_boot.services.ILeaveRequestService;
import jakarta.validation.Valid;
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
@RequestMapping("/leave-requests")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ROLE_USER', 'ROLE_MODERATOR')")
public class LeaveRequestController {

    private final ILeaveRequestService leaveRequestService;

    @PostMapping
    public ResponseEntity<ResponseWrapper<LeaveResponseDTO>> createRequest(
            @Valid @RequestBody LeaveRequestDTO requestDTO) {

        LeaveResponseDTO response = leaveRequestService.createLeaveRequest(requestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseWrapper.<LeaveResponseDTO>builder()
                .status(HttpStatus.CREATED)
                .code(HttpStatus.CREATED.value())
                .message("Leave request created successfully and is pending approval.")
                .data(response)
                .build());
    }

    @GetMapping("/my")
    public ResponseEntity<ResponseWrapper<Page<LeaveResponseDTO>>> getMyRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "all") String status) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());

        Page<LeaveResponseDTO> requests = leaveRequestService.getMyLeaveRequests(pageable, status);

        return ResponseEntity.ok(ResponseWrapper.<Page<LeaveResponseDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Fetched user's leave requests successfully.")
                .data(requests)
                .build());
    }
}
