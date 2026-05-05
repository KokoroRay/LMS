package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Service để tự động dọn dẹp thông báo cũ
 * Chạy mỗi ngày lúc 2:00 AM để xóa thông báo cũ hơn 6 tháng
 */
@Service
@RequiredArgsConstructor
public class NotificationCleanupServiceImpl {

    private final NotificationService notificationService;

    /**
     * Tự động xóa thông báo cũ hơn 6 tháng
     * Chạy mỗi ngày lúc 2:00 AM
     */
    @Scheduled(cron = "0 0 2 * * *") // 2:00 AM mỗi ngày
    public void cleanupOldNotifications() {
        try {
            notificationService.deleteOldNotifications();
        } catch (Exception e) {
            System.err.println("Error cleaning up old notifications: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
