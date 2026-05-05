package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.AttendanceRecordDTO;
import com.ra.base_spring_boot.dto.ClassSessionDTO;
import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.ClassSession;
import com.ra.base_spring_boot.model.Enrollment;
import com.ra.base_spring_boot.model.Timetable;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.repository.ClassRepository;
import com.ra.base_spring_boot.repository.ClassSessionRepository;
import com.ra.base_spring_boot.repository.EnrollmentRepository;
import com.ra.base_spring_boot.repository.TimetableRepository;
import com.ra.base_spring_boot.services.ClassSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassSessionServiceImpl implements ClassSessionService {

    private final ClassRepository classRepository;
    private final TimetableRepository timetableRepository;
    private final ClassSessionRepository classSessionRepository;
    private final EnrollmentRepository enrollmentRepository;

    /**
     * Lấy tất cả session của một lớp
     */
    @Override
    public List<ClassSession> getSessionsByClass(Integer classId) {
        return classSessionRepository.findByTimetable_ClassEntity_ClassIdOrderBySessionDateAscStartTimeAsc(classId);
    }

    /**
     * Lấy chi tiết 1 session
     */
    @Override
    public ClassSessionDTO getSessionDetails(Integer sessionId) {
        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        return ClassSessionDTO.builder()
                .sessionId(session.getSessionId())
                .sessionDate(session.getSessionDate())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .topic(session.getTopic())
                .attendanceRecords(
                        session.getAttendanceRecords().stream()
                                .map(a -> new AttendanceRecordDTO(
                                        a.getRecordId(),
                                        a.getSession().getSessionId(),
                                        a.getStudent().getId(),
                                        a.getStudent().getFullName(),
                                        a.getStatus().name(),
                                        a.getNote(),
                                        a.getRecordedAt()
                                ))
                                .collect(Collectors.toList())
                )
                .build();
    }

    /**
     * Tạo session từ timetable
     */
    @Override
    public int generateSessionsFromTimetable(Integer classId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        List<Timetable> timetables = timetableRepository.findTimetableDetailsByClassId(classId);
        int createdCount = 0;

        java.util.Set<LocalDate> existingSessionDates = classSessionRepository.findByTimetable_ClassEntity_ClassIdOrderBySessionDateAscStartTimeAsc(classId)
                .stream()
                .map(ClassSession::getSessionDate)
                .collect(Collectors.toSet());

        for (Timetable tt : timetables) {

            for (int week = 0; week < 4; week++) {
                LocalDate sessionDate = tt.getDate().plusWeeks(week);

                if (existingSessionDates.contains(sessionDate)) {
                    continue;
                }

                if (classSessionRepository.existsClassConflict(classId, tt.getStartTime(), tt.getEndTime()))
                    continue;

                boolean hasTeacherConflict = classEntity.getClassCourseTeacherAssignments().stream()
                        .map(assignment -> assignment.getTeacher())
                        .anyMatch(teacher ->
                                teacher != null && classSessionRepository.existsTeacherConflict(teacher.getId(), tt.getStartTime(), tt.getEndTime())
                        );

                if (hasTeacherConflict) {
                    continue;
                }

                ClassSession session = ClassSession.builder()
                        .timetable(tt)
                        .sessionDate(sessionDate)
                        .startTime(tt.getStartTime())
                        .endTime(tt.getEndTime())
                        .topic("Auto session for " + classEntity.getClassName())
                        .build();

                enrollmentRepository.findByClassEntity(classEntity).forEach(enroll -> {
                    session.getAttendanceRecords().add(
                            com.ra.base_spring_boot.model.AttendanceRecord.builder()
                                    .session(session)
                                    .student(enroll.getStudent())
                                    .status(com.ra.base_spring_boot.model.constants.AttendanceStatus.PENDING)
                                    .build()
                    );
                });

                classSessionRepository.save(session);
                createdCount++;
                existingSessionDates.add(sessionDate);
            }
        }

        return createdCount;
    }
}