package com.ra.base_spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TimetableDTO {
    private Integer timetableId;
    private Integer classId;
    private Integer courseId;
    private String courseTitle;
    private String teacherName;
    private String dayOfWeek;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String meetUrl;
    private String timezone;
    private String note;
    private String startDateTime;
    private String endDateTime;
}