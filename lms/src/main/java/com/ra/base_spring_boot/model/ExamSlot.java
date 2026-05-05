package com.ra.base_spring_boot.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;


@Entity
@Table(name = "exam_slots")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer slotId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "slot_time", nullable = false, columnDefinition = "datetime(6)")
    private LocalDateTime slotTime;

    private Integer maxParticipants;

    @Builder.Default
    private Integer currentParticipants = 0;

    @Column(name = "created_at", updatable = false, columnDefinition = "datetime(6)")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
