package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.req.NotificationRequestDTO;
import com.ra.base_spring_boot.dto.resp.NotificationResponseDTO;
import com.ra.base_spring_boot.model.Notification;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.repository.NotificationRepository;
import com.ra.base_spring_boot.repository.UserRepository;
import com.ra.base_spring_boot.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý logic liên quan đến Notification
 * 
 * SimpMessagingTemplate: Class của Spring để gửi message qua WebSocket
 * Giống như một "người đưa thư" - nhận message và gửi đến đúng địa chỉ
 */
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    // Repository để lưu/đọc thông báo từ database
    private final NotificationRepository notificationRepository;
    
    // Repository để lấy thông tin user
    private final UserRepository userRepository;
    
    // Template để gửi message qua WebSocket
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Tạo thông báo mới và lưu vào database
     */
    @Override
    @Transactional // Đảm bảo tất cả thao tác database thành công hoặc rollback
    public Notification createNotification(Integer userId, String title, String message) {
        // 1. Tìm user trong database
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Tạo object Notification mới
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .isRead(false) // Mặc định là chưa đọc
                .build();

        // 3. Lưu vào database và trả về
        return notificationRepository.save(notification);
    }

    /**
     * Gửi thông báo real-time đến user qua WebSocket
     */
    @Override
    public void sendNotificationToUser(Integer userId, Notification notification) {
        String destination = "/queue/notifications/" + userId;
        NotificationResponseDTO response = convertToDTO(notification);
        messagingTemplate.convertAndSend(destination, response);
    }
    
    /**
     * Admin gửi thông báo đến nhiều user
     */
    @Override
    @Transactional
    public List<NotificationResponseDTO> sendNotificationToUsers(NotificationRequestDTO request) {
        List<NotificationResponseDTO> results = new ArrayList<>();
        
        for (Integer userId : request.getUserIds()) {
            try {
                // Tạo và lưu thông báo
                Notification notification = createNotification(userId, request.getTitle(), request.getMessage());
                
                // Gửi real-time
                sendNotificationToUser(userId, notification);
                
                // Thêm vào kết quả
                results.add(convertToDTO(notification));
            } catch (Exception e) {
                // Log lỗi nhưng tiếp tục gửi cho user khác
                System.err.println("Failed to send notification to user " + userId + ": " + e.getMessage());
            }
        }
        
        return results;
    }
    
    /**
     * Lấy danh sách thông báo của user
     */
    @Override
    public Page<NotificationResponseDTO> getUserNotifications(Integer userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Page<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable);
        return notifications.map(this::convertToDTO);
    }
    
    /**
     * Đánh dấu thông báo đã đọc
     */
    @Override
    @Transactional
    public NotificationResponseDTO markAsRead(Integer notificationId, Integer userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        // Kiểm tra quyền: chỉ user sở hữu mới được đánh dấu đã đọc
        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        notification.setIsRead(true);
        Notification saved = notificationRepository.save(notification);
        
        return convertToDTO(saved);
    }
    
    /**
     * Đếm số thông báo chưa đọc của user
     */
    @Override
    public Long getUnreadCount(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return notificationRepository.countByUserAndIsReadFalse(user);
    }
    
    /**
     * Xóa một thông báo
     * @param notificationId ID thông báo
     * @param userId ID user (để kiểm tra quyền)
     */
    @Override
    @Transactional
    public void deleteNotification(Integer notificationId, Integer userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        // Kiểm tra quyền: chỉ user sở hữu mới được xóa
        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied: You can only delete your own notifications");
        }
        
        notificationRepository.delete(notification);
    }
    
    /**
     * Xóa nhiều thông báo cùng lúc
     * @param notificationIds Danh sách ID thông báo
     * @param userId ID user (để kiểm tra quyền)
     */
    @Override
    @Transactional
    public void deleteMultipleNotifications(List<Integer> notificationIds, Integer userId) {
        for (Integer notificationId : notificationIds) {
            Notification notification = notificationRepository.findById(notificationId)
                    .orElse(null);
            
            // Chỉ xóa thông báo của user này
            if (notification != null && notification.getUser().getId().equals(userId)) {
                notificationRepository.delete(notification);
            }
        }
    }
    
    /**
     * Xóa tất cả thông báo đã đọc của user
     * @param userId ID của user
     */
    @Override
    @Transactional
    public void deleteAllReadNotifications(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Lấy tất cả thông báo của user, filter những cái đã đọc
        List<Notification> allNotifications = notificationRepository.findByUser(user);
        List<Notification> readNotifications = allNotifications.stream()
                .filter(Notification::getIsRead)
                .collect(java.util.stream.Collectors.toList());
        
        if (!readNotifications.isEmpty()) {
            notificationRepository.deleteAll(readNotifications);
        }
    }
    
    /**
     * Xóa thông báo cũ hơn 6 tháng (scheduled task sẽ gọi)
     */
    @Override
    @Transactional
    public void deleteOldNotifications() {
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minus(6, ChronoUnit.MONTHS);
        notificationRepository.deleteByCreatedAtBefore(sixMonthsAgo);
    }
    
    /**
     * Convert Notification entity thành DTO
     */
    private NotificationResponseDTO convertToDTO(Notification notification) {
        return NotificationResponseDTO.builder()
                .notificationId(notification.getNotificationId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .senderName("Admin") // Có thể mở rộng sau để lưu thông tin người gửi
                .build();
    }
}
