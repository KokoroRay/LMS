package com.ra.base_spring_boot.dto;

import com.ra.base_spring_boot.dto.resp.CourseDTO;
import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryDTO {
    private Overview overview;
    private List<ClassDTO> myClasses;
    private List<ExamDTO> myExams;
    private List<TimetableDTO> scheduleList;
    private List<CourseDTO> myCourses;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Overview {
        private int classCount;
        private int examCount;
        private int totalStudents;
        private int upcomingSchedules;
    }
}
