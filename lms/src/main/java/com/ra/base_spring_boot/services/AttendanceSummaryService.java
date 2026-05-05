package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.AttendanceReportDTO;
import com.ra.base_spring_boot.model.AttendanceSummary;
import com.ra.base_spring_boot.repository.AttendanceSummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceSummaryService {

    private final AttendanceSummaryRepository repository;

    public List<AttendanceSummary> getByClassId(Integer classId) {
        return repository.findByIdClassIdOrderByAttendanceRateDesc(classId);
    }

    public List<AttendanceSummary> getByInstructor(List<Integer> classIds) {
        return repository.findAll().stream()
                .filter(a -> classIds.contains(a.getId().getClassId()))
                .toList();
    }

    public List<AttendanceSummary> getByStudent(Integer studentId) {
        return repository.findByIdStudentId(studentId);
    }

    /**
     * Báo cáo điểm danh kèm thống kê tổng hợp
     */
    public AttendanceReportDTO getReportWithStatistics(Integer classId) {
        List<AttendanceSummary> details = repository.findByIdClassId(classId);

        int totalStudents = details.size();
        int totalSessions = details.isEmpty() ? 0 : details.get(0).getTotalSessions();
        int totalAttended = details.stream().mapToInt(AttendanceSummary::getAttendedSessions).sum();

        BigDecimal averageRate = totalStudents == 0 ? BigDecimal.ZERO :
                BigDecimal.valueOf(details.stream()
                                .mapToDouble(a -> a.getAttendanceRate().doubleValue())
                                .average()
                                .orElse(0))
                        .setScale(2, BigDecimal.ROUND_HALF_UP);

        int threshold = 75;
        int studentsAbove = (int) details.stream().filter(a -> a.getAttendanceRate().doubleValue() >= threshold).count();
        int studentsBelow = totalStudents - studentsAbove;

        return new AttendanceReportDTO(details, totalStudents, totalSessions, totalAttended, averageRate, studentsAbove, studentsBelow);
    }
}
