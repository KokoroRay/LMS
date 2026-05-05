package com.ra.base_spring_boot.dto;

import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDate;
import java.time.LocalTime;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TimetableStudentDTO extends TimetableDTO { // <-- Kế thừa các trường mới
    private String attendanceStatus;
    private String attendanceNote;
}