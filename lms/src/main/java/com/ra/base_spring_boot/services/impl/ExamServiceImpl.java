package com.ra.base_spring_boot.services.impl;

import java.io.InputStream;
import java.util.Iterator;
import java.util.Objects;
import java.util.HashMap;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Arrays;
import java.util.Optional;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

import com.ra.base_spring_boot.dto.req.AnswerScoreDTO;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.ra.base_spring_boot.dto.ExamDTO;
import com.ra.base_spring_boot.dto.ExamQuestionDTO;
import com.ra.base_spring_boot.dto.ExamSlotDTO;
import com.ra.base_spring_boot.dto.req.*;
import com.ra.base_spring_boot.dto.resp.*;
import com.ra.base_spring_boot.model.constants.QuestionType;
import com.ra.base_spring_boot.exception.HttpBadRequest;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.mapper.ExamMapper;
import com.ra.base_spring_boot.mapper.ExamQuestionMapper;
import com.ra.base_spring_boot.mapper.ExamResultMapper;
import com.ra.base_spring_boot.mapper.ExamSlotMapper;
import com.ra.base_spring_boot.mapper.StudentExamAttemptOverrideMapper;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.ReEnrollmentStatus;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.IExamService;
import com.ra.base_spring_boot.services.NotificationService;
import com.ra.base_spring_boot.dto.resp.StudentInfoDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements IExamService {
    private final ExamQuestionRepository examQuestionRepository;
    private final ExamRepository examRepository;
    private final ExamResultRepository examResultRepository;
    private final ExamSlotRepository examSlotRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuestionBankRepository questionBankRepository;
    private final CourseRepository courseRepository;
    private final ClassCourseTeacherAssignmentRepository assignmentRepository;
    private final ObjectMapper objectMapper;
    private final ExamMapper examMapper;
    private final ExamSlotMapper examSlotMapper;
    private final ExamQuestionMapper examQuestionMapper;
    private final ExamResultMapper examResultMapper;
    private final NotificationService notificationService;
    private final StudentExamAttemptOverrideRepository studentExamAttemptOverrideRepository;
    private final CourseGradeRepository courseGradeRepository;
    private final ReEnrollmentRepository reEnrollmentRepository;
    private final StudentExamAttemptOverrideMapper studentExamAttemptOverrideMapper;

    @Override
    public List<ExamDTO> getAllExams() {
        List<Exam> exams = examRepository.findAll();
        return examMapper.toDTOList(exams);
    }

    @Override
    public List<ExamResultDTO> getAllMyExamResults(Integer studentId) {
        List<ExamResult> results = examResultRepository.findByStudent_Id(studentId);
        return results.stream()
                .map(this::buildExamResultDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Page<ExamDTO> getExamByClass(Integer classId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Exam> exams = examRepository.findByClassEntity_ClassId(classId, pageable);
        List<ExamDTO> examDTOS = examMapper.toDTOList(exams.getContent());
        return new PageImpl<>(examDTOS, pageable, exams.getTotalElements());
    }

    @Override
    public List<ExamDTO> getAvailableExamsForStudent(Integer studentId) {
        log.debug("Fetching available exams for student with ID: {}", studentId);
        if (!userRepository.existsById(studentId)) {
            throw new HttpNotFound("Student not found");
        }
        List<Integer> classIds = enrollmentRepository.findActiveClassIdsByStudentId(studentId);
        if (classIds.isEmpty()) {
            return Collections.emptyList();
        }
        LocalDateTime now = LocalDateTime.now();
        List<Exam> availableExams = new ArrayList<>();
        for (Integer classId : classIds) {
            List<Exam> exams = examRepository.findActiveExamsByClass(classId, now);
            availableExams.addAll(exams);
        }

        List<ExamResult> allStudentResults = examResultRepository.findByStudent_Id(studentId);
        Map<Integer, Boolean> submissionMap = allStudentResults.stream()
                .filter(r -> r.getSubmittedAt() != null)
                .filter(r -> r.getExam() != null && r.getExam().getExamId() != null)
                .collect(Collectors.toMap(
                        r -> r.getExam().getExamId(),
                        r -> true,
                        (a, b) -> a
                ));
        List<ExamDTO> dtos = examMapper.toDTOList(availableExams);
        dtos.forEach(dto -> {
            if (dto == null || dto.getExamId() == null) return;
            dto.setHasSubmitted(submissionMap.getOrDefault(dto.getExamId(), false));
        });
        return dtos;
    }

    @Override
    public List<ExamDTO> getAllExamsForStudent(Integer studentId) {
        log.debug("Fetching ALL exams for student with ID: {}", studentId);
        if (!userRepository.existsById(studentId)) {
            throw new HttpNotFound("Student not found");
        }
        List<Integer> classIds = enrollmentRepository.findActiveClassIdsByStudentId(studentId);
        if (classIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<Exam> allPublishedExams = new ArrayList<>();
        for (Integer classId : classIds) {
            if (classId == null) continue;
            Page<Exam> examPage = examRepository.findByClassEntity_ClassId(classId, Pageable.unpaged());
            List<Exam> classExams = examPage.getContent();
            allPublishedExams.addAll(
                    classExams.stream()
                            .filter(Objects::nonNull)
                            .filter(e -> Boolean.TRUE.equals(e.getIsPublished()))
                            .toList()
            );
        }

        Map<Integer, Long> attemptCountMap = examResultRepository.findByStudent_Id(studentId).stream()
                .filter(r -> r.getSubmittedAt() != null && r.getExam() != null)
                .collect(Collectors.groupingBy(r -> r.getExam().getExamId(), Collectors.counting()));

        return allPublishedExams.stream().map(exam -> {
            ExamDTO dto = examMapper.toDTO(exam);
            Integer examId = exam.getExamId();
            int attemptsMade = attemptCountMap.getOrDefault(examId, 0L).intValue();

            Optional<StudentExamAttemptOverride> override = studentExamAttemptOverrideRepository.findByStudent_IdAndExam_ExamId(studentId, examId);
            int effectiveMaxAttempts = exam.getMaxAttempts();
            if (override.isPresent()) {
                effectiveMaxAttempts += override.get().getExtraAttempts();
            }

            dto.setStudentAttempts(attemptsMade);
            dto.setHasSubmitted(attemptsMade >= effectiveMaxAttempts);

            if (attemptsMade >= effectiveMaxAttempts) {
                List<ExamResult> studentResultsForThisExam = examResultRepository.findByExam_ExamIdAndStudent_Id(examId, studentId);
                java.util.Set<Integer> submittedSlotIds = studentResultsForThisExam.stream()
                        .filter(r -> r.getExamSlot() != null)
                        .map(r -> r.getExamSlot().getSlotId())
                        .collect(Collectors.toSet());

                if (dto.getExamSlots() != null) {
                    List<ExamSlotDTO> filteredSlots = dto.getExamSlots().stream()
                            .filter(slot -> submittedSlotIds.contains(slot.getSlotId()))
                            .toList();
                    dto.setExamSlots(filteredSlots);
                }
            }
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public ExamDetailDTO getExamDetailsForStudent(Integer examId, Integer studentId) {
        Exam exam = examRepository.findByExamIdAndIsPublishedTrue(examId)
                .orElseThrow(() -> new HttpNotFound("Exam not found or not published"));

        boolean canAttemptOverall;
        String reasonOverall;
        try {
            validateExamAttempt(exam, studentId);
            canAttemptOverall = true;
            reasonOverall = "";
        } catch (HttpBadRequest | IllegalArgumentException e) {
            canAttemptOverall = false;
            reasonOverall = e.getMessage();
        }

        Integer attemptsMade = examResultRepository.countByExam_ExamIdAndStudent_IdAndSubmittedAtIsNotNull(examId, studentId);

        Optional<StudentExamAttemptOverride> override = studentExamAttemptOverrideRepository.findByStudent_IdAndExam_ExamId(studentId, examId);
        int effectiveMaxAttempts = exam.getMaxAttempts();
        if (override.isPresent()) {
            effectiveMaxAttempts += override.get().getExtraAttempts();
        }

        Integer remainingAttempts = Math.max(0, effectiveMaxAttempts - attemptsMade);
        ExamDTO examDTO = examMapper.toDTO(exam);
        examDTO.setStudentAttempts(attemptsMade);
        boolean hasSubmitted = attemptsMade >= effectiveMaxAttempts;
        examDTO.setHasSubmitted(hasSubmitted);

        // =======================================================================
        // [QUAN TRỌNG - ĐÃ SỬA]: LUÔN TRẢ VỀ DANH SÁCH SLOT
        // Bất kể canAttempt là true hay false, sinh viên cần thấy lịch để đếm ngược
        // =======================================================================
        List<ExamSlotDTO> slotDTOs = examSlotMapper.toDTOList(exam.getExamSlots());
        examDTO.setExamSlots(slotDTOs);
        // =======================================================================

        return ExamDetailDTO.builder()
                .exam(examDTO)
                .canAttempt(canAttemptOverall)
                .reason(reasonOverall)
                .remainingAttempts(remainingAttempts)
                .build();
    }

    @Override
    @Transactional
    public ExamResultDTO submitExam(ExamSubmissionDTO submissionDTO, Integer studentId) {
        log.info("Processing exam submission for student: {}, exam: {}, slot: {}", studentId, submissionDTO.getExamId(), submissionDTO.getSlotId());
        Exam exam = examRepository.findById(submissionDTO.getExamId()).orElseThrow(() -> new HttpNotFound("Exam not found"));
        User student = userRepository.findById(studentId).orElseThrow(() -> new HttpNotFound("Student not found"));

        if (submissionDTO.getSlotId() == null) {
            throw new HttpBadRequest("A specific exam slot must be selected for submission.");
        }

        ExamSlot slot = examSlotRepository.findById(submissionDTO.getSlotId())
                .filter(s -> s.getExam().getExamId().equals(exam.getExamId()))
                .orElseThrow(() -> new HttpNotFound("Exam slot not found or does not belong to this exam"));

        validateExamAttempt(exam, studentId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime slotTime = slot.getSlotTime();
        LocalDateTime slotEndTime = slotTime.plusMinutes(exam.getDurationMinutes());

        if (now.isBefore(slotTime)) {
            throw new HttpBadRequest("Chưa đến giờ làm bài cho ca thi này.");
        }
        if (now.isAfter(slotEndTime)) {
            throw new HttpBadRequest("Đã hết giờ làm bài cho ca thi này.");
        }

        ExamResult examResult = processNewExamSubmission(exam, student, slot, submissionDTO);
        ExamResult savedResult = examResultRepository.save(examResult);
        log.info("Exam submission processed successfully for student: {}, exam: {}, resultId: {}", studentId, submissionDTO.getExamId(), savedResult.getResultId());
        return examResultMapper.toDTO(savedResult);
    }

    @Override
    public List<ExamResultDTO> getExamResults(Integer examId, Integer studentId) {
        List<ExamResult> results = examResultRepository.findStudentResults(examId, studentId);
        return examResultMapper.toDTOList(results);
    }

    @Override
    public List<ExamSlotDTO> getExamSlots(Integer examId) {
        List<ExamSlot> slots = examSlotRepository.findByExam_ExamId(examId);
        return examSlotMapper.toDTOList(slots);
    }

    @Override
    public boolean canStudentAttemptExam(Integer examId, Integer studentId) {
        try {
            validateExamAttempt(examId, studentId);
            return true;
        } catch (HttpBadRequest | IllegalArgumentException e) {
            log.warn("Student {} cannot attempt exam {}: {}", studentId, examId, e.getMessage());
            return false;
        }
    }

    @Override
    @Transactional
    public StudentExamAttemptOverrideDTO grantExtraExamAttempt(Integer examId, Integer studentId, Integer instructorId, Integer extraAttempts) {
        log.info("Instructor {} granting {} extra attempts for exam {} to student {}", instructorId, extraAttempts, examId, studentId);

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new HttpNotFound("Exam not found with ID: " + examId));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new HttpNotFound("Student not found with ID: " + studentId));
        User instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new HttpNotFound("Instructor not found with ID: " + instructorId));

        validateInstructorIsAssigned(instructorId, exam.getClassEntity().getClassId(), exam.getCourse().getCourseId());

        if (extraAttempts == null || extraAttempts < 1) {
            throw new HttpBadRequest("Extra attempts must be at least 1.");
        }

        StudentExamAttemptOverride override = studentExamAttemptOverrideRepository
                .findByStudent_IdAndExam_ExamId(studentId, examId)
                .orElse(StudentExamAttemptOverride.builder()
                        .student(student)
                        .exam(exam)
                        .grantedByInstructor(instructor)
                        .build());

        override.setExtraAttempts(extraAttempts);
        override.setGrantedByInstructor(instructor);
        override.setGrantedAt(LocalDateTime.now());

        StudentExamAttemptOverride savedOverride = studentExamAttemptOverrideRepository.save(override);
        log.info("Granted {} extra attempts for exam {} to student {} by instructor {}", extraAttempts, examId, studentId, instructorId);
        return studentExamAttemptOverrideMapper.toDto(savedOverride);
    }

    @Override
    @Transactional
    public void revokeExtraExamAttempt(Integer examId, Integer studentId, Integer instructorId) {
        log.info("Instructor {} revoking extra attempts for exam {} from student {}", instructorId, examId, studentId);

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new HttpNotFound("Exam not found with ID: " + examId));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new HttpNotFound("Student not found with ID: " + studentId));

        validateInstructorIsAssigned(instructorId, exam.getClassEntity().getClassId(), exam.getCourse().getCourseId());

        StudentExamAttemptOverride override = studentExamAttemptOverrideRepository
                .findByStudent_IdAndExam_ExamId(studentId, examId)
                .orElseThrow(() -> new HttpNotFound("No extra attempt override found for student " + studentId + " on exam " + examId));

        studentExamAttemptOverrideRepository.delete(override);
        log.info("Revoked extra attempts for exam {} from student {} by instructor {}", examId, studentId, instructorId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentExamAttemptOverrideDTO> getStudentAttemptOverrides(Integer examId, Integer instructorId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new HttpNotFound("Exam not found with ID: " + examId));
        validateInstructorIsAssigned(instructorId, exam.getClassEntity().getClassId(), exam.getCourse().getCourseId());
        List<StudentExamAttemptOverride> overrides = studentExamAttemptOverrideRepository.findByExam_ExamId(examId);
        return overrides.stream()
                .map(studentExamAttemptOverrideMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentInfoDTO> getStudentsInExamClass(Integer examId, Integer instructorId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new HttpNotFound("Exam not found with ID: " + examId));
        validateInstructorIsAssigned(instructorId, exam.getClassEntity().getClassId(), exam.getCourse().getCourseId());
        Integer classId = exam.getClassEntity().getClassId();
        List<User> students = userRepository.findStudentsByClassId(classId);

        return students.stream()
                .map(s -> StudentInfoDTO.builder()
                        .studentId(s.getId())
                        .studentName(s.getFullName())
                        .studentEmail(s.getEmail())
                        .studentCode(s.getProfile() != null ? s.getProfile().getStudentCode() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExamDTO createExam(ExamRequestDTO examRequestDTO, Integer instructorId) {
        log.info("Creating exam for class: {} by instructor: {}", examRequestDTO.getClassId(), instructorId);

        Integer classId = examRequestDTO.getClassId();
        Integer courseId = examRequestDTO.getCourseId();
        validateInstructorIsAssigned(instructorId, classId, courseId);

        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new HttpNotFound("Class not found"));
        Course courseEntity = courseRepository.findById(courseId)
                .orElseThrow(() -> new HttpNotFound("Course not found with ID: " + courseId));

        if (examRequestDTO.getExamSlots() == null || examRequestDTO.getExamSlots().isEmpty()) {
            throw new HttpBadRequest("At least one exam slot is required.");
        }

        Exam exam = examMapper.toEntity(examRequestDTO);
        exam.setClassEntity(classEntity);
        exam.setCourse(courseEntity);
        Exam savedExam = examRepository.save(exam);

        createExamSlots(savedExam, examRequestDTO.getExamSlots());
        addQuestionsToExam(savedExam, examRequestDTO);
        rebalanceExamQuestionPoints(savedExam.getExamId());

        List<User> students = userRepository.findStudentsByClassId(classId);
        String title = "Kỳ thi mới";
        String message = String.format("Kỳ thi mới: %s", savedExam.getTitle());
        for (User student : students) {
            try {
                Notification notification = notificationService.createNotification(
                        student.getId(), title, message);
                notificationService.sendNotificationToUser(student.getId(), notification);
            } catch (Exception e) {
                log.error("Failed to send notification to student " + student.getId());
            }
        }

        return examMapper.toDTO(savedExam);
    }

    @Override
    @Transactional
    public ExamDTO updateExam(Integer examId, ExamRequestDTO examRequestDTO, Integer instructorId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new HttpNotFound("Exam not found"));

        validateInstructorIsAssigned(instructorId, exam.getClassEntity().getClassId(), exam.getCourse().getCourseId());

        if (examRequestDTO.getExamSlots() == null || examRequestDTO.getExamSlots().isEmpty()) {
            throw new HttpBadRequest("At least one exam slot is required.");
        }

        examMapper.updateEntityFromDTO(examRequestDTO, exam);
        updateAndAddExamSlots(exam, examRequestDTO.getExamSlots());
        updateExamQuestions(exam, examRequestDTO);
        rebalanceExamQuestionPoints(examId);
        Exam updatedExam = examRepository.save(exam);
        return examMapper.toDTO(updatedExam);
    }

    @Override
    @Transactional
    public void deleteExam(Integer examId) {
        log.info("Deleting exam with ID: {}", examId);
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new HttpNotFound("Exam not found"));

        // 1. Xóa các lượt cấp quyền thi lại (StudentExamAttemptOverride) liên quan đến bài thi này trước
        // [FIX LỖI SQL 1451 TẠI ĐÂY]
        List<StudentExamAttemptOverride> overrides = studentExamAttemptOverrideRepository.findByExam_ExamId(examId);
        if (!overrides.isEmpty()) {
            studentExamAttemptOverrideRepository.deleteAll(overrides);
        }

        // 2. Xóa kết quả thi (ExamResult)
        List<Integer> slotIds = exam.getExamSlots().stream().map(ExamSlot::getSlotId).collect(Collectors.toList());
        if (!slotIds.isEmpty()) {
            examResultRepository.deleteAllByExamSlot_SlotIdIn(slotIds);
        } else {
            // Fallback nếu kết quả không gắn với slot nào (logic cũ)
            examResultRepository.deleteAll(examResultRepository.findByExam_ExamId(examId));
        }

        // 3. Xóa câu hỏi và ca thi (Các bảng này có quan hệ Cascade trong Entity nhưng xóa thủ công cho chắc chắn/sạch sẽ)
        examQuestionRepository.deleteAll(exam.getExamQuestions());
        examSlotRepository.deleteAll(exam.getExamSlots());

        // 4. Cuối cùng mới xóa bài thi
        examRepository.deleteById(examId);
    }

    @Override
    @Transactional
    public ExamDTO publishExam(Integer examId) {
        return updateExamPublishStatus(examId, true);
    }

    @Override
    public ExamDTO unpublishExam(Integer examId) {
        return updateExamPublishStatus(examId, false);
    }

    @Override
    @Transactional
    public ExamQuestionDTO addQuestionToExam(Integer examId, AddExamQuestionDTO qDTO, Integer instructorId) {
        Exam exam = examRepository.findById(examId).orElseThrow(() -> new HttpNotFound("Exam not found"));
        validateInstructorIsAssigned(instructorId, exam.getClassEntity().getClassId(), exam.getCourse().getCourseId());
        ExamQuestion question;
        if (qDTO.getQuestionBankId() != null) {
            question = createQuestionFromBank(exam, qDTO);
        } else {
            if (qDTO.getQuestionText() == null || qDTO.getQuestionText().isBlank()) {
                throw new HttpBadRequest("Question text required");
            }
            if (qDTO.getQuestionType() == null) {
                throw new HttpBadRequest("Question type required");
            }
            question = examQuestionMapper.toEntity(qDTO);
            question.setExam(exam);
            if (question.getOrderIndex() == null) {
                int maxIdx = exam.getExamQuestions().stream().mapToInt(q -> q.getOrderIndex() != null ? q.getOrderIndex() : 0).max().orElse(0);
                question.setOrderIndex(maxIdx + 1);
            }
        }
        ExamQuestion savedQ = examQuestionRepository.save(question);
        rebalanceExamQuestionPoints(examId);
        return examQuestionMapper.toDTO(savedQ);
    }

    @Override
    public List<ExamQuestionDTO> getExamQuestionsForInstructor(Integer examId, Integer instructorId) {
        Exam exam = examRepository.findById(examId).orElseThrow(() -> new HttpNotFound("Exam not found"));
        validateInstructorIsAssigned(instructorId, exam.getClassEntity().getClassId(), exam.getCourse().getCourseId());
        List<ExamQuestion> questions = examQuestionRepository.findByExam_ExamId(examId);
        return examQuestionMapper.toDTOList(questions);
    }

    @Override
    @Transactional
    public ExamQuestionDTO updateExamQuestion(Integer qId, UpdateExamQuestionDTO qDTO, Integer instructorId) {
        ExamQuestion question = examQuestionRepository.findById(qId).orElseThrow(() -> new HttpNotFound("Question not found"));
        validateInstructorIsAssigned(instructorId, question.getExam().getClassEntity().getClassId(), question.getExam().getCourse().getCourseId());
        examQuestionMapper.updateEntityFromDTO(qDTO, question);
        ExamQuestion updatedQ = examQuestionRepository.save(question);
        return examQuestionMapper.toDTO(updatedQ);
    }

    @Override
    @Transactional
    public void deleteExamQuestion(Integer qId, Integer instructorId) {
        ExamQuestion question = examQuestionRepository.findById(qId).orElseThrow(() -> new HttpNotFound("Question not found"));
        Integer examId = question.getExam().getExamId();
        validateInstructorIsAssigned(instructorId, question.getExam().getClassEntity().getClassId(), question.getExam().getCourse().getCourseId());
        examQuestionRepository.delete(question);
        rebalanceExamQuestionPoints(examId);
    }

    @Override
    public List<StudentSubmissionDTO> getExamSubmissionsForInstructor(Integer examId, Integer instructorId) {
        Exam exam = examRepository.findById(examId).orElseThrow(() -> new HttpNotFound("Exam not found"));
        validateInstructorIsAssigned(instructorId, exam.getClassEntity().getClassId(), exam.getCourse().getCourseId());
        List<ExamResult> results = examResultRepository.findByExam_ExamId(examId);
        return results.stream().map(this::mapToStudentSubmissionDTO).toList();
    }

    @Override
    public StudentSubmissionDTO getSubmissionDetail(Integer resultId, Integer instructorId) {
        ExamResult result = examResultRepository.findById(resultId).orElseThrow(() -> new HttpNotFound("Submission not found"));
        validateInstructorIsAssigned(instructorId, result.getExam().getClassEntity().getClassId(), result.getExam().getCourse().getCourseId());
        return mapToStudentSubmissionDTOWithDetails(result);
    }

    @Override
    @Transactional
    public StudentSubmissionDTO gradeSubmission(Integer resultId, GradeSubmissionDTO gradeDTO, Integer instructorId) {
        ExamResult result = examResultRepository.findById(resultId)
                .orElseThrow(() -> new HttpNotFound("Submission not found"));
        validateInstructorIsAssigned(instructorId, result.getExam().getClassEntity().getClassId(), result.getExam().getCourse().getCourseId());

        Map<Integer, AnswerScoreDTO> allQuestionScoresMap = new HashMap<>();
        if (result.getDetailedGrades() != null && !result.getDetailedGrades().isBlank()) {
            try {
                List<AnswerScoreDTO> existingDetailedGrades = objectMapper.readValue(result.getDetailedGrades(), new TypeReference<List<AnswerScoreDTO>>() {});
                existingDetailedGrades.forEach(as -> allQuestionScoresMap.put(as.getQuestionId(), as));
            } catch (JsonProcessingException e) {
                log.error("Error parsing existing detailedGrades", e);
            }
        }

        if (gradeDTO.getAnswerScores() != null) {
            gradeDTO.getAnswerScores().forEach(newScore -> allQuestionScoresMap.put(newScore.getQuestionId(), newScore));
        }

        double totalEarnedRawScore = allQuestionScoresMap.values().stream()
                .mapToDouble(AnswerScoreDTO::getEarnedPoints)
                .sum();

        List<ExamQuestion> questions = examQuestionRepository.findByExam_ExamId(result.getExam().getExamId());
        double maxRawScore = questions.stream()
                .mapToDouble(q -> q.getPoints() != null ? q.getPoints() : 0.0)
                .sum();

        double scaledScore = 0.0;
        if (maxRawScore > 0) {
            scaledScore = (totalEarnedRawScore / maxRawScore) * (result.getExam().getTotalMarks() != null ? result.getExam().getTotalMarks() : 100.0);
        }

        result.setScore(scaledScore);
        result.setGradedAt(LocalDateTime.now());
        result.setFeedback(gradeDTO.getFeedback());
        try {
            result.setDetailedGrades(objectMapper.writeValueAsString(new ArrayList<>(allQuestionScoresMap.values())));
        } catch (JsonProcessingException e) {
            throw new HttpBadRequest("Invalid format for detailed answer scores.");
        }

        ExamResult updatedResult = examResultRepository.save(result);

        try {
            String title = "Kết quả thi đã có";
            String message = String.format("Kết quả thi %s: %.1f/%.0f điểm",
                    result.getExam().getTitle(), scaledScore, (double) result.getExam().getTotalMarks());
            Notification notification = notificationService.createNotification(
                    result.getStudent().getId(), title, message);
            notificationService.sendNotificationToUser(result.getStudent().getId(), notification);
        } catch (Exception e) {
            log.error("Failed to send grade notification", e);
        }

        return mapToStudentSubmissionDTOWithDetails(updatedResult);
    }

    @Override
    public ExamDTO getExamDetailsForInstructor(Integer examId, Integer instructorId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new HttpNotFound("Exam not found"));

        validateInstructorIsAssigned(
                instructorId,
                exam.getClassEntity().getClassId(),
                exam.getCourse().getCourseId()
        );

        ExamDTO dto = examMapper.toDTO(exam);
        dto.setClassId(exam.getClassEntity().getClassId());
        dto.setClassName(exam.getClassEntity().getClassName());
        dto.setCourseId(exam.getCourse().getCourseId());
        dto.setCourseTitle(exam.getCourse().getTitle());
        dto.setExamSlots(examSlotMapper.toDTOList(exam.getExamSlots()));
        dto.setExamQuestions(examQuestionMapper.toDTOList(exam.getExamQuestions()));

        return dto;
    }

    @Override
    @Transactional
    public ImportResultDTO importQuestionsFromExcel(Integer examId, MultipartFile file, Integer instructorId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new HttpNotFound("Exam not found"));
        validateInstructorIsAssigned(instructorId, exam.getClassEntity().getClassId(), exam.getCourse().getCourseId());
        List<ExamQuestion> questionsToAdd = new ArrayList<>();
        List<ImportErrorDTO> errors = new ArrayList<>();
        int currentRowNum = 0;
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (rowIterator.hasNext()) {
                rowIterator.next();
                currentRowNum++;
            } else {
                throw new HttpBadRequest("File Excel trống.");
            }
            int currentMaxOrderIndex = exam.getExamQuestions().stream()
                    .mapToInt(q -> q.getOrderIndex() != null ? q.getOrderIndex() : 0)
                    .max()
                    .orElse(0);
            int nextOrderIndex = currentMaxOrderIndex + 1;
            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                currentRowNum++;
                try {
                    String questionText = getStringCellValue(row.getCell(0));
                    String questionTypeStr = getStringCellValue(row.getCell(1));
                    List<String> options = new ArrayList<>();
                    options.add(getStringCellValue(row.getCell(2)));
                    options.add(getStringCellValue(row.getCell(3)));
                    options.add(getStringCellValue(row.getCell(4)));
                    options.add(getStringCellValue(row.getCell(5)));
                    options.removeIf(Objects::isNull);
                    String correctAnswerStr = getStringCellValue(row.getCell(6));
                    String language = getStringCellValue(row.getCell(7));
                    String starterCode = getStringCellValue(row.getCell(8));
                    String testCases = getStringCellValue(row.getCell(9));

                    if (questionText == null || questionText.isBlank()) {
                        throw new IllegalArgumentException("Nội dung câu hỏi không được để trống.");
                    }
                    if (questionTypeStr == null || questionTypeStr.isBlank()) {
                        throw new IllegalArgumentException("Loại câu hỏi không được để trống.");
                    }
                    QuestionType questionType = parseQuestionType(questionTypeStr);
                    List<String> correctAnswers = parseCorrectAnswers(correctAnswerStr);
                    ExamQuestion question = ExamQuestion.builder()
                            .exam(exam)
                            .questionText(questionText)
                            .questionType(questionType)
                            .orderIndex(nextOrderIndex++)
                            .build();
                    switch (questionType) {
                        case MCQ:
                            if (options.size() < 2) throw new IllegalArgumentException("MCQ cần ít nhất 2 lựa chọn.");
                            if (correctAnswers.size() != 1) throw new IllegalArgumentException("MCQ cần đúng 1 đáp án.");
                            if (!options.contains(correctAnswers.get(0))) throw new IllegalArgumentException("Đáp án đúng phải nằm trong các lựa chọn.");
                            question.setChoices(objectMapper.writeValueAsString(options));
                            question.setCorrectAnswer(objectMapper.writeValueAsString(correctAnswers));
                            break;
                        case MULTI:
                            if (options.size() < 2) throw new IllegalArgumentException("MULTI cần ít nhất 2 lựa chọn.");
                            if (correctAnswers.isEmpty()) throw new IllegalArgumentException("MULTI cần ít nhất 1 đáp án.");
                            for (String ans : correctAnswers) {
                                if (!options.contains(ans)) throw new IllegalArgumentException("Đáp án đúng '" + ans + "' phải nằm trong các lựa chọn.");
                            }
                            question.setChoices(objectMapper.writeValueAsString(options));
                            question.setCorrectAnswer(objectMapper.writeValueAsString(correctAnswers));
                            break;
                        case TRUE_FALSE:
                            options = Arrays.asList("True", "False");
                            if (correctAnswers.size() != 1 || !options.contains(correctAnswers.get(0))) {
                                throw new IllegalArgumentException("Đáp án TRUE_FALSE không hợp lệ (phải là 'True' hoặc 'False').");
                            }
                            question.setChoices(objectMapper.writeValueAsString(options));
                            question.setCorrectAnswer(objectMapper.writeValueAsString(correctAnswers));
                            break;
                        case SHORT_ANSWER:
                            question.setChoices("[]");
                            question.setCorrectAnswer("[]");
                            break;
                        case CODING:
                            question.setLanguage(language);
                            question.setStarterCode(starterCode);
                            question.setTestCases(testCases);
                            question.setChoices("[]");
                            question.setCorrectAnswer("[]");
                            break;
                        default:
                            throw new IllegalArgumentException("Loại câu hỏi không hỗ trợ: " + questionTypeStr);
                    }
                    questionsToAdd.add(question);
                } catch (Exception e) {
                    errors.add(new ImportErrorDTO(currentRowNum, e.getMessage()));
                }
            }
        } catch (Exception e) {
            log.error("Lỗi nghiêm trọng khi đọc file Excel", e);
            throw new HttpBadRequest("Không thể đọc hoặc xử lý file Excel: " + e.getMessage());
        }
        if (!questionsToAdd.isEmpty()) {
            examQuestionRepository.saveAll(questionsToAdd);
            rebalanceExamQuestionPoints(examId);
        }
        return ImportResultDTO.builder()
                .successCount(questionsToAdd.size())
                .errorCount(errors.size())
                .errors(errors)
                .build();
    }

    private void validateInstructorIsAssigned(Integer instructorId, Integer classId, Integer courseId) {
        if (classId == null || courseId == null) {
            throw new HttpBadRequest("Class ID and Course ID are required.");
        }
        boolean isAssigned = assignmentRepository.existsByClassEntityClassIdAndCourseCourseIdAndTeacherId(
                classId,
                courseId,
                instructorId
        );
        if (!isAssigned) {
            throw new HttpBadRequest("Bạn không được phân công dạy môn học này trong lớp này.");
        }
    }

    private void createExamSlots(Exam exam, List<ExamSlotRequestDTO> examSlotDTOs) {
        if (examSlotDTOs != null && !examSlotDTOs.isEmpty()) {
            List<ExamSlot> examSlots = examSlotMapper.toEntityList(examSlotDTOs);
            examSlots.forEach(examSlot -> examSlot.setExam(exam));
            examSlotRepository.saveAll(examSlots);
        }
    }

    private ExamResultDTO buildExamResultDTO(ExamResult result) {
        if (result == null) {
            return null;
        }
        return ExamResultDTO.builder()
                .resultId(result.getResultId())
                .examId(result.getExam().getExamId())
                .examTitle(result.getExam().getTitle())
                .studentId(result.getStudent().getId())
                .studentName(result.getStudent().getFullName())
                .score(result.getScore())
                .timeSpent(result.getTimeSpent())
                .githubUrl(result.getGithubUrl())
                .submittedAt(result.getSubmittedAt())
                .gradedAt(result.getGradedAt())
                .feedback(result.getFeedback())
                .build();
    }

    private void updateAndAddExamSlots(Exam exam, List<ExamSlotRequestDTO> requestedSlots) {
        if (requestedSlots == null) {
            return;
        }
        Map<Integer, ExamSlot> existingSlotsMap = exam.getExamSlots().stream()
                .collect(Collectors.toMap(ExamSlot::getSlotId, slot -> slot));
        List<ExamSlot> slotsToSave = new ArrayList<>();
        List<ExamSlot> slotsToDelete = new ArrayList<>();
        List<Integer> requestedSlotIds = requestedSlots.stream()
                .map(ExamSlotRequestDTO::getSlotId)
                .filter(java.util.Objects::nonNull)
                .toList();
        for (ExamSlot existingSlot : existingSlotsMap.values()) {
            if (!requestedSlotIds.contains(existingSlot.getSlotId())) {
                slotsToDelete.add(existingSlot);
            }
        }
        for (ExamSlotRequestDTO reqSlot : requestedSlots) {
            if (reqSlot.getSlotId() != null) {
                ExamSlot slotToUpdate = existingSlotsMap.get(reqSlot.getSlotId());
                if (slotToUpdate != null) {
                    slotToUpdate.setSlotTime(reqSlot.getSlotTime());
                    slotToUpdate.setMaxParticipants(reqSlot.getMaxParticipants());
                    slotsToSave.add(slotToUpdate);
                }
            } else {
                ExamSlot newSlot = examSlotMapper.toEntity(reqSlot);
                newSlot.setExam(exam);
                slotsToSave.add(newSlot);
            }
        }
        if (!slotsToDelete.isEmpty()) {
            List<Integer> slotIdsToDelete = slotsToDelete.stream().map(ExamSlot::getSlotId).toList();
            examResultRepository.deleteAllByExamSlot_SlotIdIn(slotIdsToDelete);
            examSlotRepository.deleteAll(slotsToDelete);
            exam.getExamSlots().removeAll(slotsToDelete);
        }
        if (!slotsToSave.isEmpty()) {
            List<ExamSlot> savedSlots = examSlotRepository.saveAll(slotsToSave);
            exam.getExamSlots().addAll(savedSlots.stream()
                    .filter(s -> !existingSlotsMap.containsKey(s.getSlotId()))
                    .toList());
        }
    }

    private void addQuestionsToExam(Exam exam, ExamRequestDTO examRequestDTO) {
        int orderIndex = exam.getExamQuestions().stream()
                .mapToInt(q -> q.getOrderIndex() != null ? q.getOrderIndex() : 0)
                .max()
                .orElse(0) + 1;
        if (examRequestDTO.getQuestionsFromBank() != null && !examRequestDTO.getQuestionsFromBank().isEmpty()) {
            orderIndex = addQuestionsFromBank(exam, examRequestDTO.getQuestionsFromBank(), orderIndex);
        }
        if (examRequestDTO.getCustomQuestions() != null && !examRequestDTO.getCustomQuestions().isEmpty()) {
            addCustomQuestions(exam, examRequestDTO.getCustomQuestions(), orderIndex);
        }
    }

    private void updateExamQuestions(Exam exam, ExamRequestDTO examRequestDTO) {
        addQuestionsToExam(exam, examRequestDTO);
    }

    private int addQuestionsFromBank(Exam exam, List<QuestionFromBankRequestDTO> questionsFromBank, int startOrderIndex) {
        List<ExamQuestion> examQuestions = new ArrayList<>();
        int orderIndex = startOrderIndex;
        for (QuestionFromBankRequestDTO qfb : questionsFromBank) {
            QuestionBank qb = questionBankRepository.findById(qfb.getQuestionId()).orElseThrow(() -> new IllegalArgumentException("Question not found"));
            ExamQuestion eq = ExamQuestion.builder().exam(exam).questionText(qb.getQuestionText()).questionType(qb.getQuestionType())
                    .points(qfb.getPoints()).choices(qb.getChoices()).correctAnswer(qb.getCorrectAnswer()).orderIndex(orderIndex++).build();
            examQuestions.add(eq);
        }
        examQuestionRepository.saveAll(examQuestions);
        return orderIndex;
    }

    private void addCustomQuestions(Exam exam, List<CustomQuestionRequestDTO> customQuestions, int startOrderIndex) {
        List<ExamQuestion> examQuestions = new ArrayList<>();
        int orderIndex = startOrderIndex;
        for (CustomQuestionRequestDTO cq : customQuestions) {
            ExamQuestion eq = examQuestionMapper.toEntity(cq);
            eq.setExam(exam);
            eq.setOrderIndex(orderIndex++);
            examQuestions.add(eq);
        }
        examQuestionRepository.saveAll(examQuestions);
    }

    // ========================================================================
    // CHẤM BÀI (FINAL VERSION) - Fix lỗi hiển thị 3/3 Test Case ảo
    // ========================================================================
    private ExamResult processNewExamSubmission(Exam exam, User student, ExamSlot examSlot, ExamSubmissionDTO submissionDTO) {
        // ... (Khai báo biến đầu hàm giữ nguyên) ...
        List<ExamQuestion> questions = examQuestionRepository.findByExam_ExamId(exam.getExamId());
        double earnedTotalScore = 0.0;
        double maxPossibleScore = 0.0;
        boolean hasManualGrading = false;
        List<AnswerScoreDTO> detailedScores = new ArrayList<>();

        final int MAX_VIOLATIONS = 3;
        boolean isCheated = submissionDTO.getViolationCount() != null && submissionDTO.getViolationCount() > MAX_VIOLATIONS;

        for (ExamQuestion q : questions) {
            double qPoints = (q.getPoints() != null ? q.getPoints() : 0.0);
            maxPossibleScore += qPoints;

            Optional<AnswerSubmissionDTO> saOpt = submissionDTO.getAnswers().stream()
                    .filter(a -> a.getQuestionId() != null && a.getQuestionId().equals(q.getExQId())).findFirst();

            AnswerScoreDTO scoreDetail = AnswerScoreDTO.builder()
                    .questionId(q.getExQId()).earnedPoints(0.0).build();

            boolean isAttempted = false;

            if (saOpt.isPresent()) {
                AnswerSubmissionDTO ans = saOpt.get();

                // --- BƯỚC 1: CHECK CÓ LÀM BÀI KHÔNG? ---
                switch (q.getQuestionType()) {
                    // ... (Case MCQ, SHORT_ANSWER giữ nguyên) ...
                    case MCQ:
                    case MULTI:
                    case TRUE_FALSE:
                        if (ans.getSelectedOptions() != null && !ans.getSelectedOptions().isEmpty()) isAttempted = true;
                        break;
                    case SHORT_ANSWER:
                        if (ans.getAnswerText() != null && !ans.getAnswerText().trim().isEmpty()) isAttempted = true;
                        break;

                    case CODING:
                        String studentCode = ans.getAnswerText();
                        String starterCode = q.getStarterCode();
                        boolean isEmpty = studentCode == null || studentCode.trim().isEmpty();
                        boolean isJustStarter = starterCode != null && studentCode != null && studentCode.trim().equals(starterCode.trim());

                        if (!isEmpty && !isJustStarter) {
                            isAttempted = true;
                        } else {
                            // [QUAN TRỌNG] Nếu là code mẫu/rỗng -> XÓA KẾT QUẢ TEST CASE ẢO
                            // Để database không lưu lại cái "3/3 Passed" vô lý
                            ans.setTestCaseResults(new ArrayList<>());
                        }
                        break;
                }

                // --- BƯỚC 2: TÍNH ĐIỂM ---
                if (isAttempted) {
                    // ... (Logic tính điểm giữ nguyên như version trước) ...
                    if (q.getQuestionType() == QuestionType.SHORT_ANSWER) {
                        hasManualGrading = true;
                    } else if (q.getQuestionType() == QuestionType.CODING) {
                        List<TestCaseResultDTO> tcResults = ans.getTestCaseResults();
                        if (tcResults != null && !tcResults.isEmpty()) {
                            long passedCount = tcResults.stream().filter(t -> Boolean.TRUE.equals(t.getIsCorrect())).count();
                            double earned = ((double) passedCount / tcResults.size()) * qPoints;
                            if (isCheated) earned = 0.0;
                            scoreDetail.setEarnedPoints(earned);
                            earnedTotalScore += earned;
                        }
                    } else {
                        if (checkAnswerCorrectness(q, ans)) {
                            double earned = qPoints;
                            if (isCheated) earned = 0.0;
                            scoreDetail.setEarnedPoints(earned);
                            earnedTotalScore += earned;
                        }
                    }
                } else {
                    scoreDetail.setEarnedPoints(0.0);
                }
            }
            detailedScores.add(scoreDetail);
        }

        // --- BƯỚC 3: TỔNG KẾT ---
        if (isCheated) {
            earnedTotalScore = 0.0;
            // Nếu gian lận, cũng nên xóa sạch test case results trong answers JSON để instructor không bị confuse
            submissionDTO.getAnswers().forEach(a -> a.setTestCaseResults(new ArrayList<>()));
        } else {
            double examTotalMarks = (exam.getTotalMarks() != null) ? exam.getTotalMarks() : 100.0;
            if (maxPossibleScore > 0) {
                earnedTotalScore = (earnedTotalScore / maxPossibleScore) * examTotalMarks;
            }
        }

        ExamResult examResult = ExamResult.builder()
                .exam(exam).student(student).examSlot(examSlot)
                .score(earnedTotalScore)
                .violationCount(submissionDTO.getViolationCount() != null ? submissionDTO.getViolationCount() : 0)
                .startedAt(examSlot.getSlotTime()).submittedAt(LocalDateTime.now())
                .timeSpent(exam.getDurationMinutes())
                .githubUrl(submissionDTO.getGithubUrl()).ideSessionId(submissionDTO.getIdeSessionId())
                .build();

        if (isCheated) {
            examResult.setFeedback("HỆ THỐNG: Hủy kết quả (0 điểm) do vi phạm quy chế thi.");
        } else if (earnedTotalScore == 0.0 && !hasManualGrading) {
            examResult.setFeedback("Chưa làm câu nào hoặc nộp giấy trắng.");
        }

        if (Boolean.TRUE.equals(exam.getShowResultImmediately()) && !hasManualGrading) {
            examResult.setGradedAt(LocalDateTime.now());
        }

        try {
            // Lúc này submissionDTO.getAnswers() đã được "làm sạch" test case ảo ở trên
            examResult.setAnswers(objectMapper.writeValueAsString(submissionDTO.getAnswers()));
            examResult.setDetailedGrades(objectMapper.writeValueAsString(detailedScores));
        } catch (JsonProcessingException e) {
            log.error("Error saving answers JSON", e);
        }

        return examResult;
    }

    private void validateExamAttempt(Exam exam, Integer studentId) {
        if (!Boolean.TRUE.equals(exam.getIsPublished())) {
            throw new HttpBadRequest("Kỳ thi này chưa được công bố.");
        }
        boolean isEnrolled = enrollmentRepository.existsByStudentIdAndClassEntityClassId(studentId, exam.getClassEntity().getClassId());
        if (!isEnrolled) {
            throw new HttpBadRequest("Bạn không có trong lớp học này.");
        }
        Integer attemptsMade = examResultRepository.countByExam_ExamIdAndStudent_IdAndSubmittedAtIsNotNull(exam.getExamId(), studentId);

        Optional<StudentExamAttemptOverride> override = studentExamAttemptOverrideRepository.findByStudent_IdAndExam_ExamId(studentId, exam.getExamId());
        int effectiveMaxAttempts = exam.getMaxAttempts();
        if (override.isPresent()) {
            effectiveMaxAttempts += override.get().getExtraAttempts();
        }

        if (attemptsMade >= effectiveMaxAttempts) {
            // ⭐ LUỒNG MỚI: Kiểm tra quyền thi lại nếu đã hết số lần
            if (!canRetakeExam(exam.getExamId(), studentId)) {
                throw new HttpBadRequest("Bạn đã hết số lần làm bài!");
            }
        }

        LocalDateTime now = LocalDateTime.now();
        boolean hasActiveSlot = exam.getExamSlots().stream().anyMatch(slot -> {
            LocalDateTime slotTime = slot.getSlotTime();
            LocalDateTime slotEndTime = slotTime.plusMinutes(exam.getDurationMinutes());
            return now.isAfter(slotTime) && now.isBefore(slotEndTime);
        });

        if (!hasActiveSlot) {
            boolean allSlotsEnded = exam.getExamSlots().stream().allMatch(slot -> {
                LocalDateTime slotTime = slot.getSlotTime();
                LocalDateTime slotEndTime = slotTime.plusMinutes(exam.getDurationMinutes());
                return now.isAfter(slotEndTime);
            });

            if (allSlotsEnded) {
                throw new HttpBadRequest("Kỳ thi đã kết thúc.");
            } else {
                boolean anySlotUpcoming = exam.getExamSlots().stream().anyMatch(slot -> {
                    LocalDateTime slotTime = slot.getSlotTime();
                    return now.isBefore(slotTime);
                });

                if (anySlotUpcoming) {
                    throw new HttpBadRequest("Kỳ thi chưa bắt đầu. Vui lòng quay lại sau.");
                } else {
                    throw new HttpBadRequest("Kỳ thi này hiện không có ca thi đang diễn ra.");
                }
            }
        }
    }

    private void validateExamAttempt(Integer examId, Integer studentId) {
        Exam exam = examRepository.findById(examId).orElseThrow(() -> new HttpBadRequest("Kỳ thi không tồn tại."));
        validateExamAttempt(exam, studentId);
    }

    private ExamDTO updateExamPublishStatus(Integer examId, boolean isPublished) {
        Exam exam = examRepository.findById(examId).orElseThrow(() -> new HttpNotFound("Exam not found"));
        exam.setIsPublished(isPublished);
        Exam updatedExam = examRepository.save(exam);

        if (isPublished) {
            List<User> students = userRepository.findStudentsByClassId(exam.getClassEntity().getClassId());
            String title = "Kỳ thi đã được công bố";
            String message = String.format("Kỳ thi %s đã sẵn sàng. Bạn có thể tham gia thi ngay bây giờ!", exam.getTitle());

            for (User student : students) {
                try {
                    Notification notification = notificationService.createNotification(
                            student.getId(), title, message);
                    notificationService.sendNotificationToUser(student.getId(), notification);
                } catch (Exception e) {
                    log.error("Failed to send notification", e);
                }
            }
        }
        return examMapper.toDTO(updatedExam);
    }

    private void rebalanceExamQuestionPoints(Integer examId) {
        List<ExamQuestion> questions = examQuestionRepository.findByExam_ExamId(examId);
        if (questions.isEmpty()) {
            return;
        }

        // Biến lưu trọng số của từng câu hỏi
        // - Câu thường: weight = 1
        // - Câu coding: weight = số lượng test case
        Map<Integer, Integer> questionWeights = new HashMap<>();
        int totalWeightUnits = 0;

        for (ExamQuestion q : questions) {
            int weight = 1; // Mặc định là 1 (cho MCQ, Short Answer...)

            if (q.getQuestionType() == QuestionType.CODING) {
                int testCaseCount = 0;
                try {
                    if (q.getTestCases() != null && !q.getTestCases().isBlank()) {
                        // Parse JSON để đếm số lượng test case thực tế
                        List<?> list = objectMapper.readValue(q.getTestCases(), List.class);
                        testCaseCount = list.size();
                    }
                } catch (JsonProcessingException e) {
                    log.error("Lỗi đếm test case câu hỏi ID: " + q.getExQId(), e);
                }

                // Nếu có test case thì trọng số bằng số lượng test case.
                // Nếu không (lỡ giáo viên quên nhập), vẫn tính là 1 để không bị lỗi chia 0.
                weight = (testCaseCount > 0) ? testCaseCount : 1;
            }

            questionWeights.put(q.getExQId(), weight);
            totalWeightUnits += weight;
        }

        // Lấy tổng điểm của bài thi (thường là 100)
        // Exam exam = examRepository.findById(examId).orElse(...);
        // double totalExamMarks = (exam.getTotalMarks() != null) ? exam.getTotalMarks() : 100.0;
        double totalExamMarks = 100.0;

        // Tính giá trị điểm cho 1 đơn vị trọng số
        double pointsPerUnit = (totalWeightUnits > 0) ? (totalExamMarks / totalWeightUnits) : 0.0;

        // Gán điểm lại cho từng câu hỏi
        for (ExamQuestion q : questions) {
            int weight = questionWeights.getOrDefault(q.getExQId(), 1);
            double calculatedPoints = pointsPerUnit * weight;

            // Làm tròn 2 chữ số thập phân cho đẹp (tùy chọn)
            calculatedPoints = Math.round(calculatedPoints * 100.0) / 100.0;

            q.setPoints(calculatedPoints);
        }

        examQuestionRepository.saveAll(questions);
    }

    private StudentSubmissionDTO mapToStudentSubmissionDTO(ExamResult r) {
        double maxRawScore = examQuestionRepository.findByExam_ExamId(r.getExam().getExamId()).stream()
                .mapToDouble(q -> q.getPoints() != null ? q.getPoints() : 0.0)
                .sum();

        return StudentSubmissionDTO.builder()
                .resultId(r.getResultId()).examId(r.getExam().getExamId()).examTitle(r.getExam().getTitle())
                .studentId(r.getStudent().getId()).studentName(r.getStudent().getFullName()).studentEmail(r.getStudent().getEmail())
                .score(r.getScore())
                .startedAt(r.getStartedAt()).submittedAt(r.getSubmittedAt()).gradedAt(r.getGradedAt())
                .timeSpent(r.getTimeSpent()).githubUrl(r.getGithubUrl())
                .feedback(r.getFeedback())
                .totalMarks(r.getExam().getTotalMarks())
                .maxRawScore(maxRawScore)
                .violationCount(r.getViolationCount())
                .build();
    }

    private StudentSubmissionDTO mapToStudentSubmissionDTOWithDetails(ExamResult r) {
        StudentSubmissionDTO dto = mapToStudentSubmissionDTO(r);
        dto.setAnswers(r.getAnswers());

        Map<Integer, Double> manualGrades = new HashMap<>();
        if (r.getDetailedGrades() != null && !r.getDetailedGrades().isBlank()) {
            try {
                List<AnswerScoreDTO> detailedGrades = objectMapper.readValue(r.getDetailedGrades(), new TypeReference<List<AnswerScoreDTO>>() {});
                for (AnswerScoreDTO grade : detailedGrades) {
                    manualGrades.put(grade.getQuestionId(), grade.getEarnedPoints());
                }
            } catch (JsonProcessingException e) {
                log.error("Error parsing detailedGrades", e);
            }
        }

        try {
            if (r.getAnswers() == null || r.getAnswers().isBlank()) {
                dto.setAnswerDetails(Collections.emptyList());
                return dto;
            }

            List<AnswerSubmissionDTO> studentAnswers = objectMapper.readValue(r.getAnswers(), new TypeReference<List<AnswerSubmissionDTO>>() {});
            List<ExamQuestion> questions = examQuestionRepository.findByExam_ExamId(r.getExam().getExamId());
            List<SubmissionAnswerDTO> answerDetails = new ArrayList<>();

            for (ExamQuestion q : questions) {
                Optional<AnswerSubmissionDTO> saOpt = studentAnswers.stream()
                        .filter(a -> a.getQuestionId() != null && a.getQuestionId().equals(q.getExQId()))
                        .findFirst();

                double questionPoints = q.getPoints() != null ? q.getPoints() : 0.0;

                SubmissionAnswerDTO ad = SubmissionAnswerDTO.builder()
                        .questionId(q.getExQId())
                        .questionText(q.getQuestionText())
                        .questionType(q.getQuestionType())
                        .points(questionPoints)
                        .correctAnswer(q.getCorrectAnswer())
                        .language(q.getLanguage())
                        .starterCode(q.getStarterCode())
                        .testCases(q.getTestCases())
                        .build();

                if (manualGrades.containsKey(q.getExQId())) {
                    Double earned = manualGrades.get(q.getExQId());
                    ad.setEarnedPoints(earned);
                    ad.setIsCorrect(earned != null && Math.abs(earned - questionPoints) < 0.01);
                } else {
                    ad.setEarnedPoints(0.0);
                    ad.setIsCorrect(false);
                }

                if (saOpt.isPresent()) {
                    AnswerSubmissionDTO studentAns = saOpt.get();
                    ad.setStudentAnswer(objectMapper.writeValueAsString(studentAns));
                    if (q.getQuestionType() == QuestionType.CODING) {
                        ad.setTestCaseResults(studentAns.getTestCaseResults());
                    }
                }
                answerDetails.add(ad);
            }
            dto.setAnswerDetails(answerDetails);
        } catch (JsonProcessingException e) {
            log.error("Error parsing answers for submission", e);
        }
        return dto;
    }

    private boolean checkAnswerCorrectness(ExamQuestion q, AnswerSubmissionDTO sa) {
        try {
            if (q.getQuestionType() == QuestionType.MULTI || q.getQuestionType() == QuestionType.MCQ || q.getQuestionType() == QuestionType.TRUE_FALSE) {
                if (q.getCorrectAnswer() == null || q.getCorrectAnswer().isBlank()) {
                    return false;
                }
                List<String> ca = objectMapper.readValue(q.getCorrectAnswer(), new TypeReference<List<String>>() {});
                List<String> saList = sa.getSelectedOptions();

                if (saList == null || ca.isEmpty()) {
                    return false;
                }

                if (q.getQuestionType() == QuestionType.MULTI) {
                    return saList.size() == ca.size() && new HashSet<>(saList).equals(new HashSet<>(ca));
                } else {
                    return saList.equals(ca);
                }
            }
            return false;
        } catch (JsonProcessingException e) {
            log.error("Error checking answer correctness", e);
            return false;
        }
    }

    private ExamQuestion createQuestionFromBank(Exam exam, AddExamQuestionDTO qDTO) {
        QuestionBank qb = questionBankRepository.findById(qDTO.getQuestionBankId()).orElseThrow(() -> new HttpNotFound("QB not found: " + qDTO.getQuestionBankId()));
        int maxIdx = exam.getExamQuestions().stream().mapToInt(q -> q.getOrderIndex() != null ? q.getOrderIndex() : 0).max().orElse(0);
        ExamQuestion eq = ExamQuestion.builder().exam(exam).questionText(qb.getQuestionText()).questionType(qb.getQuestionType())
                .points(qDTO.getPoints()).choices(qb.getChoices()).correctAnswer(qb.getCorrectAnswer())
                .orderIndex(qDTO.getOrderIndex() != null ? qDTO.getOrderIndex() : maxIdx + 1).build();
        return eq;
    }

    private String getStringCellValue(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) return null;
                double val = cell.getNumericCellValue();
                return (val == Math.floor(val)) ? String.valueOf((long) val) : String.valueOf(val);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue().trim();
                } catch (Exception e) {
                    try {
                        double formulaVal = cell.getNumericCellValue();
                        return (formulaVal == Math.floor(formulaVal)) ? String.valueOf((long) formulaVal) : String.valueOf(formulaVal);
                    } catch (Exception ex) {
                        return null;
                    }
                }
            default:
                return null;
        }
    }

    private QuestionType parseQuestionType(String typeStr) {
        String upperType = typeStr.toUpperCase().trim();
        return switch (upperType) {
            case "MCQ", "MULTIPLE_CHOICE", "SINGLE" -> QuestionType.MCQ;
            case "MULTI", "MULTIPLE_ANSWER", "CHECKBOX" -> QuestionType.MULTI;
            case "TRUE_FALSE", "TF" -> QuestionType.TRUE_FALSE;
            case "SHORT", "SHORT_ANSWER", "LINK" -> QuestionType.SHORT_ANSWER;
            case "CODING", "PROGRAMMING" -> QuestionType.CODING;
            default -> throw new IllegalArgumentException("Loại câu hỏi không hợp lệ: " + typeStr);
        };
    }

    private List<String> parseCorrectAnswers(String answersStr) {
        if (answersStr == null || answersStr.isBlank()) return Collections.emptyList();
        return Arrays.stream(answersStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    @Override
    public boolean canRetakeExam(Integer examId, Integer studentId) {
        // Lấy thông tin exam
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new HttpNotFound("Exam not found"));

        // Tìm CourseGrade của sinh viên cho môn học này
        Optional<CourseGrade> courseGradeOpt = courseGradeRepository
                .findByStudent_IdAndClassEntity_ClassIdAndCourse_CourseId(
                    studentId, 
                    exam.getClassEntity().getClassId(), 
                    exam.getCourse().getCourseId()
                );

        if (courseGradeOpt.isEmpty()) {
            return false;
        }

        CourseGrade courseGrade = courseGradeOpt.get();

        // Kiểm tra xem có re-enrollment nào với trạng thái RETAKE_ACTIVATED không
        Optional<ReEnrollment> retakeReEnrollmentOpt = reEnrollmentRepository
                .findByFailedCourseGrade_CourseGradeIdAndStatus(
                    courseGrade.getCourseGradeId(), 
                    ReEnrollmentStatus.RETAKE_ACTIVATED
                );

        return retakeReEnrollmentOpt.isPresent();
    }
}