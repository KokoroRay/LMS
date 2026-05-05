package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Integer sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false) // giữ nguyên tên cột course_id
    private Course course;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    // Cho phép null (service sẽ chuẩn hoá về >=1 / set default khi create)
    @Column(name = "position")
    private Integer position;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /* ----------------- Compatibility helpers (legacy) ----------------- */
    /** Nhiều chỗ cũ gọi getName() → map sang title để không vỡ code. */
    public String getName() {
        return this.title;
    }

    /** Nếu code cũ gọi setName(), ta ghi vào title. */
    public void setName(String name) {
        this.title = name;
    }

    /* ----------------- Timestamps (nếu DB không auto) ----------------- */
    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        // Không ép position ở đây; service đã xử lý logic position & chống trùng
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
