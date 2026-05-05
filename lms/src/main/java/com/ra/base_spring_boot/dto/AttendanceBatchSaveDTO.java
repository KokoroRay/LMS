package com.ra.base_spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceBatchSaveDTO {
    private Integer timetableId;
    private List<AttendanceUpdateDTO> records;
}