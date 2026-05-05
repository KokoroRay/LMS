package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.model.AttendanceRecord;
import com.ra.base_spring_boot.model.AttendanceSummary;
import com.ra.base_spring_boot.model.AttendanceSummaryId;
import com.ra.base_spring_boot.model.constants.AttendanceStatus;
import com.ra.base_spring_boot.repository.AttendanceRecordRepository;
import com.ra.base_spring_boot.repository.AttendanceSummaryRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class AttendanceRecordService {

    private final AttendanceRecordRepository recordRepository;
    private final AttendanceSummaryRepository summaryRepository;

    /**
     * Thêm mới điểm danh và cập nhật attendance_summary
     */
    @Transactional
    public AttendanceRecord addRecord(AttendanceRecord record) {
        AttendanceRecord saved = recordRepository.save(record);

        Integer studentId = record.getStudent().getId();
        Integer classId = record.getSession().getTimetable().getClassEntity().getClassId();

        AttendanceSummary summary = summaryRepository.findById(new AttendanceSummaryId(studentId, classId))
                .orElse(AttendanceSummary.builder()
                        .id(new AttendanceSummaryId(studentId, classId))
                        .totalSessions(0)
                        .attendedSessions(0)
                        .absentSessions(0)
                        .attendanceRate(BigDecimal.ZERO)
                        .build());

        summary.setTotalSessions(summary.getTotalSessions() + 1);
        if(record.getStatus() == AttendanceStatus.PRESENT) {
            summary.setAttendedSessions(summary.getAttendedSessions() + 1);
        } else {
            summary.setAbsentSessions(summary.getAbsentSessions() + 1);
        }

        summary.setAttendanceRate(
                BigDecimal.valueOf(summary.getAttendedSessions())
                        .divide(BigDecimal.valueOf(summary.getTotalSessions()), 2, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
        );

        summaryRepository.save(summary);
        return saved;
    }
}

