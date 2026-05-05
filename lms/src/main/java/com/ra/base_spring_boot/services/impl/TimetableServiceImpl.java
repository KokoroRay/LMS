package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.AttendanceRecordDTO;
import com.ra.base_spring_boot.dto.ClassSessionDTO;
import com.ra.base_spring_boot.dto.TimetableDTO;
import com.ra.base_spring_boot.dto.resp.TimetableResponseDTO;
import com.ra.base_spring_boot.dto.ClassDTO;
import com.ra.base_spring_boot.dto.TimetableStudentDTO;
import com.ra.base_spring_boot.dto.resp.CourseDTO;
import com.ra.base_spring_boot.model.AttendanceRecord;
import com.ra.base_spring_boot.model.Timetable;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.ClassCourseTeacherAssignment;
import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.ClassSession;
import com.ra.base_spring_boot.model.Course;
import com.ra.base_spring_boot.exception.TimetableConflictException;
import com.ra.base_spring_boot.exception.InvalidTimetableOperationException;
import com.ra.base_spring_boot.exception.ResourceNotFoundException;
import com.ra.base_spring_boot.model.constants.AttendanceStatus;
import com.ra.base_spring_boot.repository.AttendanceRecordRepository;
import com.ra.base_spring_boot.repository.EnrollmentRepository;
import com.ra.base_spring_boot.repository.TimetableRepository;
import com.ra.base_spring_boot.repository.UserRepository;
import com.ra.base_spring_boot.repository.ClassRepository;
import com.ra.base_spring_boot.repository.ClassCourseTeacherAssignmentRepository;
import com.ra.base_spring_boot.repository.CourseRepository;
import com.ra.base_spring_boot.services.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import org.springframework.security.core.context.SecurityContextHolder;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimetableServiceImpl implements TimetableService {
    private final TimetableRepository timetableRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final ClassCourseTeacherAssignmentRepository assignmentRepository;
    private final EntityManager entityManager;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final CourseRepository courseRepository;

    private Integer getCurrentInstructorId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof MyUserDetails) {
            return ((MyUserDetails) principal).getUser().getId();
        }
        throw new ResourceNotFoundException("Cannot find authenticated user ID.");
    }

    private ClassDTO mapToClassDTO(ClassEntity c) {
        String categoryName = c.getCategory() != null ? c.getCategory().getName() : null;

        Set<String> teacherNames = c.getClassCourseTeacherAssignments().stream()
                .map(a -> a.getTeacher() != null ? a.getTeacher().getFullName() : "N/A")
                .collect(Collectors.toSet());

        Set<Integer> courseIds = c.getClassCourseTeacherAssignments().stream()
                .map(a -> a.getCourse() != null ? a.getCourse().getCourseId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> courseTitles = c.getClassCourseTeacherAssignments().stream()
                .map(a -> a.getCourse() != null ? a.getCourse().getTitle() : "N/A")
                .collect(Collectors.toSet());

        return ClassDTO.builder()
                .classId(c.getClassId())
                .className(c.getClassName())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .capacity(c.getCapacity())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .teacherNames(teacherNames)
                .categoryId(c.getCategory() != null ? c.getCategory().getCategoryId() : null)
                .categoryName(categoryName)
                .courseIds(courseIds)
                .courseTitles(courseTitles)
                .build();
    }

    private TimetableDTO mapToTimetableDTO(Timetable timetable) {
        String teacherName = "Giáo viên N/A";
        String courseTitle = "Môn học N/A";
        if (timetable.getCourse() != null) {
            courseTitle = timetable.getCourse().getTitle();
            if (timetable.getClassEntity() != null && timetable.getCourse() != null) {
                ClassCourseTeacherAssignment assignment = assignmentRepository
                        .findByClassEntityClassIdAndCourseCourseId(
                                timetable.getClassEntity().getClassId(),
                                timetable.getCourse().getCourseId()
                        ).orElse(null);
                if (assignment != null && assignment.getTeacher() != null) {
                    teacherName = assignment.getTeacher().getFullName();
                }
            }
        }
        return TimetableDTO.builder()
                .classId(timetable.getClassEntity().getClassId())
                .courseId(timetable.getCourse() != null ? timetable.getCourse().getCourseId() : null)
                .courseTitle(courseTitle)
                .teacherName(teacherName)
                .dayOfWeek(timetable.getDayOfWeek().name())
                .date(timetable.getDate())
                .startTime(timetable.getStartTime())
                .endTime(timetable.getEndTime())
                .meetUrl(timetable.getMeetUrl())
                .timezone(timetable.getTimezone())
                .note(timetable.getNote())
                .build();
    }

    private TimetableResponseDTO mapToResponseDTO(Timetable t) {
        List<ClassSessionDTO> sessions = t.getClassSessions().stream()
                .map(s -> ClassSessionDTO.builder()
                        .sessionId(s.getSessionId())
                        .sessionDate(s.getSessionDate())
                        .startTime(s.getStartTime())
                        .endTime(s.getEndTime())
                        .topic(s.getTopic())
                        .attendanceRecords(s.getAttendanceRecords().stream()
                                .map(a -> new AttendanceRecordDTO(
                                        a.getRecordId(),
                                        a.getSession().getSessionId(),
                                        a.getStudent().getId(),
                                        a.getStudent().getFullName(),
                                        a.getStatus().name(),
                                        a.getNote(),
                                        a.getRecordedAt()
                                ))
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
        String singleCourseTitle = "Môn học chưa gán";
        String teacherName = "Giáo viên N/A";
        if (t.getCourse() != null) {
            singleCourseTitle = t.getCourse().getTitle();
            if (t.getClassEntity() != null) {
                Integer classId = t.getClassEntity().getClassId();
                Integer courseId = t.getCourse().getCourseId();
                ClassCourseTeacherAssignment assignment = entityManager.createQuery(
                                "SELECT a FROM ClassCourseTeacherAssignment a WHERE a.classEntity.classId = :classId AND a.course.courseId = :courseId", ClassCourseTeacherAssignment.class)
                        .setParameter("classId", classId)
                        .setParameter("courseId", courseId)
                        .getResultList().stream().findFirst().orElse(null);
                if (assignment != null && assignment.getTeacher() != null) {
                    User teacher = assignment.getTeacher();
                    teacherName = teacher.getFullName();
                }
            }
        }
        return TimetableResponseDTO.builder()
                .timetableId(t.getTimetableId())
                .className(t.getClassEntity().getClassName())
                .courseTitle(singleCourseTitle)
                .teacherName(teacherName)
                .dayOfWeek(t.getDayOfWeek().name())
                .date(t.getDate())
                .startTime(t.getStartTime())
                .endTime(t.getEndTime())
                .meetUrl(t.getMeetUrl())
                .timezone(t.getTimezone())
                .note(t.getNote())
                .sessions(sessions)
                .startDateTime(t.getDate().atTime(t.getStartTime()).toString())
                .endDateTime(t.getDate().atTime(t.getEndTime()).toString())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimetableStudentDTO> getStudentTimetableWithAttendance(Integer studentId) {
        List<Integer> activeClassIds = enrollmentRepository.findActiveClassIdsByStudentId(studentId);
        if (activeClassIds.isEmpty()) {
            return List.of();
        }
        List<Timetable> timetables = timetableRepository.findTimetableDetailsByClassIdIn(activeClassIds);
        List<AttendanceRecord> studentRecords = attendanceRecordRepository.findByStudent_Id(studentId);
        Map<Integer, AttendanceRecord> attendanceMap = studentRecords.stream()
                .filter(record -> record.getSession() != null && record.getSession().getTimetable() != null)
                .collect(Collectors.toMap(
                        record -> record.getSession().getTimetable().getTimetableId(),
                        record -> record,
                        (existing, replacement) -> existing
                ));
        return timetables.stream()
                .map(timetable -> {
                    AttendanceRecord record = attendanceMap.get(timetable.getTimetableId());
                    String status = (record != null) ? record.getStatus().name() : AttendanceStatus.PENDING.name();
                    String note = (record != null) ? record.getNote() : "";
                    TimetableDTO baseDto = mapToTimetableDTO(timetable);
                    return TimetableStudentDTO.builder()
                            .timetableId(timetable.getTimetableId())
                            .attendanceStatus(status)
                            .attendanceNote(note)
                            .classId(baseDto.getClassId())
                            .courseId(baseDto.getCourseId())
                            .courseTitle(baseDto.getCourseTitle())
                            .teacherName(baseDto.getTeacherName())
                            .dayOfWeek(baseDto.getDayOfWeek())
                            .date(baseDto.getDate())
                            .startTime(baseDto.getStartTime())
                            .endTime(baseDto.getEndTime())
                            .meetUrl(baseDto.getMeetUrl())
                            .timezone(baseDto.getTimezone())
                            .note(baseDto.getNote())
                            .startDateTime(timetable.getDate().atTime(timetable.getStartTime()).toString())
                            .endDateTime(timetable.getDate().atTime(timetable.getEndTime()).toString())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimetableResponseDTO> findAllSlotsByClassId(Integer classId) {
        List<Timetable> allTimetables = timetableRepository.findTimetableDetailsByClassId(classId);
        return allTimetables.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimetableResponseDTO> findByClassId(Integer classId) {
        Integer currentInstructorId = getCurrentInstructorId();
        List<ClassCourseTeacherAssignment> assignments = assignmentRepository
                .findByClassEntityClassIdAndTeacherId(classId, currentInstructorId);
        if (assignments.isEmpty()) {
            return List.of();
        }
        Set<Integer> courseIds = assignments.stream()
                .map(a -> a.getCourse().getCourseId())
                .collect(Collectors.toSet());
        List<Timetable> filteredTimetables = timetableRepository.findTimetableDetailsByClassIdAndCourseIds(classId, courseIds);
        return filteredTimetables.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimetableResponseDTO> findMyEntireTimetable() {
        Integer currentInstructorId = getCurrentInstructorId();
        List<ClassCourseTeacherAssignment> allAssignments = assignmentRepository.findByTeacherId(currentInstructorId);
        Set<Integer> classIds = allAssignments.stream()
                .map(a -> a.getClassEntity().getClassId())
                .collect(Collectors.toSet());
        if (classIds.isEmpty()) {
            return List.of();
        }
        List<Timetable> allTimetables = timetableRepository.findTimetableDetailsByClassIdIn(classIds.stream().toList());
        return allTimetables.stream()
                .filter(t -> assignmentRepository.existsByClassEntityClassIdAndCourseCourseIdAndTeacherId(
                        t.getClassEntity().getClassId(),
                        t.getCourse().getCourseId(),
                        currentInstructorId
                ))
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }


    @Override
    @Transactional(readOnly = true)
    public List<ClassDTO> findClassesByInstructorId() {
        Integer currentInstructorId = getCurrentInstructorId();

        List<ClassEntity> distinctClasses =
                classRepository.findClassesByInstructorInvolvement(currentInstructorId);

        return distinctClasses.stream()
                .map(this::mapToClassDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<com.ra.base_spring_boot.dto.resp.CourseDTO> findCoursesByClassIdAndInstructor(Integer classId, Integer instructorId) {
        List<Course> courses = courseRepository.findCoursesByClassAndTeacher(
                classId,
                instructorId
        );
        return courses.stream()
                .map(c -> com.ra.base_spring_boot.dto.resp.CourseDTO.builder()
                        .courseId(c.getCourseId())
                        .title(c.getTitle())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<TimetableResponseDTO> findAll() {
        return timetableRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public TimetableResponseDTO findById(Integer id) {
        Timetable t = timetableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable not found"));
        return mapToResponseDTO(t);
    }

    @Override
    @Transactional
    public TimetableResponseDTO create(TimetableDTO dto) {
        LocalDateTime slotStart = dto.getDate().atTime(dto.getStartTime());
        if (slotStart.isBefore(LocalDateTime.now())) throw new InvalidTimetableOperationException("Cannot schedule in the past (time already passed today)");

        ClassEntity classEntity = classRepository.findById(dto.getClassId())
                .orElseThrow(() -> new ResourceNotFoundException("Class not found"));

        Set<Course> coursesInClass = classEntity.getClassCourseTeacherAssignments().stream()
                .map(ClassCourseTeacherAssignment::getCourse)
                .collect(Collectors.toSet());

        Course course = coursesInClass.stream()
                .filter(c -> c.getCourseId().equals(dto.getCourseId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Course not found or not assigned to this class."));

        // KIỂM TRA XUNG ĐỘT LỚP HỌC (CHẶN TẠO MỚI SLOT TRÙNG LẶP TRONG CÙNG LỚP)
        boolean conflictClass = timetableRepository.existsConflictForClass(
                classEntity.getClassId(), dto.getDate(), dto.getStartTime(), dto.getEndTime()
        );
        if (conflictClass) throw new TimetableConflictException("Lớp đã có lịch học khác trong khoảng thời gian này!");

        ClassCourseTeacherAssignment assignment = assignmentRepository
                .findByClassEntityClassIdAndCourseCourseId(classEntity.getClassId(), course.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment details not found for this class and course."));

        Integer teacherId = assignment.getTeacher().getId();
        // KIỂM TRA XUNG ĐỘT GIÁO VIÊN
        boolean conflictTeacher = timetableRepository.existsConflictForTeacherExcludingId(
                teacherId, dto.getDate(), dto.getStartTime(), dto.getEndTime(), 0
        );
        if (conflictTeacher ) throw new TimetableConflictException("Giáo viên đã có lịch dạy lớp khác trong khoảng thời gian này! Vui lòng kiểm tra lại.");

        Timetable timetable = Timetable.builder()
                .classEntity(classEntity)
                .course(course)
                .dayOfWeek(Enum.valueOf(Timetable.DayOfWeek.class, dto.getDayOfWeek()))
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .meetUrl(dto.getMeetUrl())
                .timezone(dto.getTimezone())
                .note(dto.getNote())
                .build();

        if (timetable.getClassSessions() == null) {
            timetable.setClassSessions(new HashSet<>());
        }

        ClassSession session = ClassSession.builder()
                .sessionDate(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .topic("Auto session for " + classEntity.getClassName() + " - " + course.getTitle())
                .timetable(timetable)
                .classEntity(classEntity)
                .build();

        timetable.addSession(session);
        Timetable saved = timetableRepository.save(timetable);
        return mapToResponseDTO(saved);
    }

    @Override
    @Transactional
    public TimetableResponseDTO update(Integer id, TimetableDTO dto) {
        Timetable t = timetableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable not found"));

        LocalDateTime slotStart = dto.getDate().atTime(dto.getStartTime());
        if (slotStart.isBefore(LocalDateTime.now())) throw new InvalidTimetableOperationException("Cannot move to past (time already passed today)");

        ClassEntity classEntity = t.getClassEntity();

        Set<Course> coursesInClass = classEntity.getClassCourseTeacherAssignments().stream()
                .map(ClassCourseTeacherAssignment::getCourse)
                .collect(Collectors.toSet());

        Course course = coursesInClass.stream()
                .filter(c -> c.getCourseId().equals(dto.getCourseId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Course not found or not assigned to this class."));

        ClassCourseTeacherAssignment assignment = assignmentRepository
                .findByClassEntityClassIdAndCourseCourseId(classEntity.getClassId(), course.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment details not found for this class and course."));

        Integer teacherId = assignment.getTeacher().getId();

        // KIỂM TRA XUNG ĐỘT LỚP HỌC (loại trừ ID hiện tại)
        boolean conflictClass = timetableRepository.existsConflictExcludingId(
                classEntity.getClassId(), dto.getDate(), dto.getStartTime(), dto.getEndTime(), id
        );
        if (conflictClass) throw new TimetableConflictException("Lớp đã có lịch học khác trong khoảng thời gian này!");

        // KIỂM TRA XUNG ĐỘT GIÁO VIÊN (loại trừ ID hiện tại)
        boolean conflictTeacher = timetableRepository.existsConflictForTeacherExcludingId(
                teacherId, dto.getDate(), dto.getStartTime(), dto.getEndTime(), id
        );
        if (conflictTeacher) throw new TimetableConflictException("Giáo viên đã có lịch dạy lớp khác trong khoảng thời gian này! Vui lòng kiểm tra lại.");

        t.setDayOfWeek(Enum.valueOf(Timetable.DayOfWeek.class, dto.getDayOfWeek()));
        t.setDate(dto.getDate());
        t.setStartTime(dto.getStartTime());
        t.setEndTime(dto.getEndTime());
        t.setMeetUrl(dto.getMeetUrl());
        t.setTimezone(dto.getTimezone());
        t.setNote(dto.getNote());

        t.getClassSessions().forEach(s -> {
            s.setSessionDate(dto.getDate());
            s.setStartTime(dto.getStartTime());
            s.setEndTime(dto.getEndTime());
            s.setTopic("Auto session for " + classEntity.getClassName() + " - " + course.getTitle());
        });

        return mapToResponseDTO(timetableRepository.save(t));
    }

    @Override
    public void delete(Integer id) {
        Timetable t = timetableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable not found"));
        if (t.getDate().isBefore(LocalDate.now()))
            throw new InvalidTimetableOperationException("Không thể xóa lịch học trong quá khứ!");
        timetableRepository.delete(t);
    }
}