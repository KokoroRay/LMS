package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Notification;
import com.ra.base_spring_boot.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository để thao tác với bảng notifications
 * JpaRepository cung cấp sẵn các method: save(), findById(), findAll(), delete()...
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    
    // Lấy tất cả thông báo của 1 user, sắp xếp mới nhất trước
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    
    // Lấy thông báo của user với phân trang
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    // Lấy các thông báo chưa đọc của 1 user
    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
    
    // Đếm số thông báo chưa đọc của 1 user
    Long countByUserAndIsReadFalse(User user);
    
    // Xóa thông báo cũ hơn một khoảng thời gian
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    void deleteByCreatedAtBefore(LocalDateTime cutoffDate);
    
    // Xóa thông báo của một user cũ hơn một khoảng thời gian
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user = :user AND n.createdAt < :cutoffDate")
    void deleteByUserAndCreatedAtBefore(User user, LocalDateTime cutoffDate);

    // Lấy tất cả thông báo của user (không phân trang) - để xóa đã đọc
    List<Notification> findByUser(User user);
}
