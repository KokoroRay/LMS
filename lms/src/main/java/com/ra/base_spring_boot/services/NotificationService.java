package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.req.NotificationRequestDTO;
import com.ra.base_spring_boot.dto.resp.NotificationResponseDTO;
import com.ra.base_spring_boot.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Interface định nghĩa các chức năng liên quan đến Notification
 */
public interface NotificationService {
    
    /**
     * Tạo thông báo mới và lưu vào database
     * @param userId ID của user sẽ nhận thông báo
     * @param title Tiêu đề thông báo
     * @param message Nội dung thông báo
     * @return Notification đã được lưu
     */
    Notification createNotification(Integer userId, String title, String message);
    
    /**
     * Gửi thông báo real-time đến user qua WebSocket
     * @param userId ID của user sẽ nhận thông báo
     * @param notification Thông báo cần gửi
     */
    void sendNotificationToUser(Integer userId, Notification notification);
    
    /**
     * Admin gửi thông báo đến nhiều user
     * @param request Thông tin thông báo
     * @return Danh sách thông báo đã tạo
     */
    List<NotificationResponseDTO> sendNotificationToUsers(NotificationRequestDTO request);
    
    /**
     * Lấy danh sách thông báo của user
     * @param userId ID của user
     * @param pageable Phân trang
     * @return Danh sách thông báo
     */
    Page<NotificationResponseDTO> getUserNotifications(Integer userId, Pageable pageable);
    
    /**
     * Đánh dấu thông báo đã đọc
     * @param notificationId ID thông báo
     * @param userId ID user (để kiểm tra quyền)
     * @return Thông báo đã cập nhật
     */
    NotificationResponseDTO markAsRead(Integer notificationId, Integer userId);
    
    /**
     * Đếm số thông báo chưa đọc của user
     * @param userId ID của user
     * @return Số lượng thông báo chưa đọc
     */
    Long getUnreadCount(Integer userId);
    
    /**
     * Xóa một thông báo
     * @param notificationId ID thông báo
     * @param userId ID user (để kiểm tra quyền)
     */
    void deleteNotification(Integer notificationId, Integer userId);
    
    /**
     * Xóa nhiều thông báo cùng lúc
     * @param notificationIds Danh sách ID thông báo
     * @param userId ID user (để kiểm tra quyền)
     */
    void deleteMultipleNotifications(List<Integer> notificationIds, Integer userId);
    
    /**
     * Xóa tất cả thông báo đã đọc của user
     * @param userId ID của user
     */
    void deleteAllReadNotifications(Integer userId);
    
    /**
     * Xóa thông báo cũ hơn 6 tháng (scheduled task sẽ gọi)
     */
    void deleteOldNotifications();
}
