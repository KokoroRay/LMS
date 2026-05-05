package com.ra.base_spring_boot.dto.req;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class TimetableRequestDTO {
    private Integer classId;
    private String dayOfWeek;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String meetUrl;
    private String timezone;
    private String note;
}

