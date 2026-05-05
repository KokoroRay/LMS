package com.ra.base_spring_boot.dto.resp;

import com.ra.base_spring_boot.dto.ClassSessionDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TimetableResponseDTO {
    private Integer timetableId;
    private String className;
    private String courseTitle;
    private String teacherName;
    private String dayOfWeek;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String meetUrl;
    private String timezone;
    private String note;
    private List<ClassSessionDTO> sessions;
    private String startDateTime;
    private String endDateTime;
}