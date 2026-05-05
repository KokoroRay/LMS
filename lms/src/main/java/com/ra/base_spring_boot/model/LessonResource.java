package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.constants.ResourceType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resource_id")
    private Integer resourceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(name = "file_url", length = 512, nullable = false)
    private String fileUrl;

    @Column(name = "title", length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", length = 50)
    private ResourceType resourceType = ResourceType.FILE;


    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false, nullable = false)
    private LocalDateTime uploadedAt;
}
