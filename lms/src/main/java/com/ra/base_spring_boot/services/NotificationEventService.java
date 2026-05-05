package com.ra.base_spring_boot.services;

import java.util.List;

/**
 * Service để quản lý các sự kiện thông báo tự động
 */
public interface NotificationEventService {
    
    /**
     * Gửi thông báo deadline sắp tới cho assignments
     */
    void sendUpcomingDeadlineNotifications();
    
    /**
     * Gửi thông báo nhắc nhở exam sắp diễn ra
     */
    void sendUpcomingExamNotifications();
    
    /**
     * Gửi thông báo cho tất cả student trong lớp
     */
    void notifyAllStudentsInClass(Integer classId, String title, String message);
    
    /**
     * Gửi thông báo cho danh sách users
     */
    void notifyUsers(List<Integer> userIds, String title, String message);
}