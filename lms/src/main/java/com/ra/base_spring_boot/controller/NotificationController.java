package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.req.NotificationRequestDTO;
import com.ra.base_spring_boot.dto.resp.NotificationResponseDTO;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Admin gửi thông báo đến nhiều user
     */
    @PostMapping("/admin/send")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<ResponseWrapper<List<NotificationResponseDTO>>> sendNotification(
            @Valid @RequestBody NotificationRequestDTO request) {
        
        List<NotificationResponseDTO> notifications = notificationService.sendNotificationToUsers(request);
        
        return ResponseEntity.ok(ResponseWrapper.<List<NotificationResponseDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Notifications sent successfully")
                .data(notifications)
                .build());
    }

    /**
     * User lấy danh sách thông báo của mình
     */
    @GetMapping("/my-notifications")
    public ResponseEntity<ResponseWrapper<Page<NotificationResponseDTO>>> getMyNotifications(
            @AuthenticationPrincipal MyUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationResponseDTO> notifications = notificationService.getUserNotifications(
                userDetails.getUser().getId(), pageable);
        
        return ResponseEntity.ok(ResponseWrapper.<Page<NotificationResponseDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get notifications successfully")
                .data(notifications)
                .build());
    }

    /**
     * Đánh dấu thông báo đã đọc
     */
    @PutMapping("/{notificationId}/mark-read")
    public ResponseEntity<ResponseWrapper<NotificationResponseDTO>> markAsRead(
            @PathVariable Integer notificationId,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        
        NotificationResponseDTO notification = notificationService.markAsRead(
                notificationId, userDetails.getUser().getId());
        
        return ResponseEntity.ok(ResponseWrapper.<NotificationResponseDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Notification marked as read")
                .data(notification)
                .build());
    }

    /**
     * Lấy số lượng thông báo chưa đọc
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ResponseWrapper<Long>> getUnreadCount(
            @AuthenticationPrincipal MyUserDetails userDetails) {
        
        Long count = notificationService.getUnreadCount(userDetails.getUser().getId());
        
        return ResponseEntity.ok(ResponseWrapper.<Long>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get unread count successfully")
                .data(count)
                .build());
    }

    /**
     * Xóa một thông báo
     */
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<ResponseWrapper<Void>> deleteNotification(
            @PathVariable Integer notificationId,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        
        notificationService.deleteNotification(notificationId, userDetails.getUser().getId());
        
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Notification deleted successfully")
                .build());
    }

    /**
     * Xóa nhiều thông báo cùng lúc
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<ResponseWrapper<Void>> deleteMultipleNotifications(
            @RequestBody List<Integer> notificationIds,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        
        notificationService.deleteMultipleNotifications(notificationIds, userDetails.getUser().getId());
        
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Notifications deleted successfully")
                .build());
    }

    /**
     * Xóa tất cả thông báo đã đọc
     */
    @DeleteMapping("/read")
    public ResponseEntity<ResponseWrapper<Void>> deleteAllReadNotifications(
            @AuthenticationPrincipal MyUserDetails userDetails) {
        
        notificationService.deleteAllReadNotifications(userDetails.getUser().getId());
        
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("All read notifications deleted successfully")
                .build());
    }
}
