package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.AttendanceRecordDTO;
import com.ra.base_spring_boot.dto.AttendanceSummaryDTO;
import com.ra.base_spring_boot.dto.AttendanceUpdateDTO;
import com.ra.base_spring_boot.dto.AttendanceBatchSaveDTO;

import java.util.List;

public interface AttendanceService {
    AttendanceRecordDTO recordAttendance(Integer studentId, Integer sessionId, String status, String note);
    List<AttendanceRecordDTO> getAttendanceByClass(Integer classId);
    List<AttendanceSummaryDTO> getAttendanceSummaryByClass(Integer classId);

    List<AttendanceSummaryDTO> getStudentAttendanceSummary(Integer studentId);

    List<AttendanceUpdateDTO> getAttendanceListByTimetable(Integer timetableId);
    void saveBatchAttendance(AttendanceBatchSaveDTO saveDTO);
}