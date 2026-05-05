package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Model đại diện cho bảng notifications trong database
 * Mỗi thông báo sẽ có: id, user_id, title, message, is_read, created_at
 */
@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Integer notificationId;

    // Thông báo này thuộc về user nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Tiêu đề thông báo
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    // Nội dung thông báo
    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    // Đã đọc chưa? (false = chưa đọc, true = đã đọc)
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    // Thời gian tạo thông báo - Tự động set khi tạo mới
    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;
}
