package com.ra.base_spring_boot.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSummaryId implements Serializable {

    @Column(name = "student_id")
    private Integer studentId;

    @Column(name = "class_id")
    private Integer classId;
}
