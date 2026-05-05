package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.AttendanceRecordDTO;
import com.ra.base_spring_boot.dto.AttendanceSummaryDTO;
import com.ra.base_spring_boot.dto.AttendanceUpdateDTO;
import com.ra.base_spring_boot.dto.AttendanceBatchSaveDTO;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.AttendanceStatus;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.AttendanceService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceSummaryRepository attendanceSummaryRepository;
    private final UserRepository userRepository;
    private final ClassSessionRepository classSessionRepository;
    private final TimetableRepository timetableRepository;

    // ====================
    // UPDATE SUMMARY
    // ====================
    private void updateSummary(User student, ClassEntity classEntity) {

        AttendanceSummaryId id = new AttendanceSummaryId(student.getId(), classEntity.getClassId());

        AttendanceSummary summary = attendanceSummaryRepository.findById(id)
                .orElse(AttendanceSummary.builder()
                        .id(id)
                        .totalSessions(0)
                        .attendedSessions(0)
                        .absentSessions(0)
                        .attendanceRate(BigDecimal.ZERO)
                        .build());

        List<AttendanceRecord> records =
                attendanceRecordRepository.findByStudent_IdAndSession_Timetable_ClassEntity_ClassId(
                        student.getId(),
                        classEntity.getClassId()
                );

        int total = records.size();
        int attended = (int) records.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        int absent = (int) records.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();

        BigDecimal rate = total == 0 ? BigDecimal.ZERO :
                BigDecimal.valueOf(attended * 100.0 / total).setScale(2, RoundingMode.HALF_UP);

        summary.setTotalSessions(total);
        summary.setAttendedSessions(attended);
        summary.setAbsentSessions(absent);
        summary.setAttendanceRate(rate);

        attendanceSummaryRepository.save(summary);
    }

    @Override
    public AttendanceRecordDTO recordAttendance(Integer studentId, Integer sessionId, String status, String note) {
        throw new RuntimeException("Self attendance is disabled.");
    }

    @Override
    public List<AttendanceRecordDTO> getAttendanceByClass(Integer classId) {
        return attendanceRecordRepository.findBySession_Timetable_ClassEntity_ClassId(classId)
                .stream().map(this::map).collect(Collectors.toList());
    }

    @Override
    public List<AttendanceSummaryDTO> getAttendanceSummaryByClass(Integer classId) {
        return attendanceSummaryRepository.findByIdClassId(classId)
                .stream().map(this::mapSummary).collect(Collectors.toList());
    }

    @Override
    public List<AttendanceSummaryDTO> getStudentAttendanceSummary(Integer studentId) {
        return attendanceSummaryRepository.findByIdStudentId(studentId)
                .stream().map(this::mapSummary).collect(Collectors.toList());
    }

    @Override
    public List<AttendanceUpdateDTO> getAttendanceListByTimetable(Integer timetableId) {

        Timetable timetable = timetableRepository.findById(timetableId)
                .orElseThrow(() -> new RuntimeException("Timetable not found"));

        List<ClassSession> sessions = classSessionRepository.findByTimetable_TimetableId(timetableId);
        if (sessions.isEmpty()) throw new RuntimeException("Class Session not found");
        ClassSession session = sessions.get(0);

        Integer classId = timetable.getClassEntity().getClassId();
        List<User> students = userRepository.findStudentsByClassId(classId);
        List<AttendanceRecord> existing = attendanceRecordRepository.findBySession_SessionId(session.getSessionId());

        Map<Integer, AttendanceRecord> recordMap = existing.stream()
                .collect(Collectors.toMap(
                        r -> r.getStudent().getId(),
                        r -> r
                ));

        return students.stream()
                .map(st -> {
                    AttendanceRecord rec = recordMap.get(st.getId());
                    return AttendanceUpdateDTO.builder()
                            .studentId(st.getId())
                            .studentName(st.getFullName())
                            .status(rec != null ? rec.getStatus().name() : AttendanceStatus.PENDING.name())
                            .note(rec != null ? rec.getNote() : "")
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public void saveBatchAttendance(AttendanceBatchSaveDTO saveDTO) {

        Timetable timetable = timetableRepository.findById(saveDTO.getTimetableId())
                .orElseThrow(() -> new RuntimeException("Timetable not found"));

        List<ClassSession> sessions = classSessionRepository.findByTimetable_TimetableId(saveDTO.getTimetableId());
        if (sessions.isEmpty()) throw new RuntimeException("Class Session not found");
        ClassSession session = sessions.get(0);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = session.getSessionDate().atTime(timetable.getStartTime());
        LocalDateTime end = session.getSessionDate().atTime(LocalTime.MAX);

        if (now.isBefore(start)) throw new RuntimeException("Buổi học chưa bắt đầu.");
        if (now.isAfter(end)) throw new RuntimeException("Đã qua ngày học. Không thể sửa điểm danh.");

        for (AttendanceUpdateDTO dto : saveDTO.getRecords()) {

            User student = userRepository.findById(dto.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            AttendanceRecord record = attendanceRecordRepository
                    .findBySessionAndStudent(session, student)
                    .orElse(AttendanceRecord.builder()
                            .session(session)
                            .student(student)
                            .status(AttendanceStatus.PENDING)
                            .build());

            record.setStatus(AttendanceStatus.valueOf(dto.getStatus()));
            record.setNote(dto.getNote());
            record.setRecordedAt(LocalDateTime.now());

            attendanceRecordRepository.save(record);

            updateSummary(student, timetable.getClassEntity());
        }
    }

    private AttendanceRecordDTO map(AttendanceRecord r) {
        return new AttendanceRecordDTO(
                r.getRecordId(),
                r.getSession().getSessionId(),
                r.getStudent().getId(),
                r.getStudent().getFullName(),
                r.getStatus().name(),
                r.getNote(),
                r.getRecordedAt()
        );
    }

    private AttendanceSummaryDTO mapSummary(AttendanceSummary s) {

        User student = userRepository.findById(s.getId().getStudentId()).orElse(null);

        ClassEntity classEntity = classSessionRepository
                .findFirstByTimetable_ClassEntity_ClassId(s.getId().getClassId())
                .map(ClassSession::getClassEntity)
                .orElse(null);

        return new AttendanceSummaryDTO(
                s.getId().getStudentId(),
                student != null ? student.getFullName() : "Unknown",
                s.getId().getClassId(),
                classEntity != null ? classEntity.getClassName() : "Unknown",
                s.getTotalSessions(),
                s.getAttendedSessions(),
                s.getAbsentSessions(),
                s.getAttendanceRate()
        );
    }
}
