package com.ra.base_spring_boot.controller;
import com.ra.base_spring_boot.dto.ExamDTO;
import com.ra.base_spring_boot.dto.ExamQuestionDTO;
import com.ra.base_spring_boot.dto.ExamSlotDTO;
import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.req.AddExamQuestionDTO;
import com.ra.base_spring_boot.dto.req.ExamRequestDTO;
import com.ra.base_spring_boot.dto.req.ExamSubmissionDTO;
import com.ra.base_spring_boot.dto.req.GradeSubmissionDTO;
import com.ra.base_spring_boot.dto.req.UpdateExamQuestionDTO;
import com.ra.base_spring_boot.dto.resp.ExamDetailDTO;
import com.ra.base_spring_boot.dto.resp.ExamResultDTO;
import com.ra.base_spring_boot.dto.resp.StudentSubmissionDTO;
import com.ra.base_spring_boot.dto.resp.StudentExamAttemptOverrideDTO;
import com.ra.base_spring_boot.dto.resp.StudentInfoDTO;
import com.ra.base_spring_boot.dto.req.GrantAttemptRequestDTO;
import com.ra.base_spring_boot.exception.HttpBadRequest;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.IExamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.ra.base_spring_boot.dto.resp.ImportResultDTO;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;
@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
@Slf4j
public class ExamController {
    private final IExamService examService;

    @GetMapping
    public ResponseEntity<List<ExamDTO>> getAllExamsForAdmin() {
        List<ExamDTO> exams = examService.getAllExams();
        return ResponseEntity.ok(exams);
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<ResponseWrapper> getExamsByClass(
            @PathVariable Integer classId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ExamDTO> exams = examService.getExamByClass(classId, page, size);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Get exams successfully").data(exams).build());
    }
    @PostMapping
    public ResponseEntity<ResponseWrapper> createExam(
            @Valid @RequestBody ExamRequestDTO examRequest,
            @RequestParam(required = false) Integer classId,
            Authentication authentication) {
        if (classId != null && examRequest.getClassId() == null) {
            examRequest.setClassId(classId);
        }

        Integer instructorId = getCurrentUserId(authentication);
        ExamDTO exam = examService.createExam(examRequest, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Create exam successfully").data(exam).build());
    }
    @PostMapping("/classes/{classId}/exams")
    public ResponseEntity<ResponseWrapper> createExamForClass(
            @PathVariable Integer classId,
            @Valid @RequestBody ExamRequestDTO examRequest,
            Authentication authentication) {
        examRequest.setClassId(classId);

        Integer instructorId = getCurrentUserId(authentication);
        ExamDTO exam = examService.createExam(examRequest, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Create exam successfully").data(exam).build());
    }
    @PutMapping("/{examId}")
    public ResponseEntity<ResponseWrapper> updateExam(
            @PathVariable Integer examId,
            @Valid @RequestBody ExamRequestDTO examRequest,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        ExamDTO exam = examService.updateExam(examId, examRequest, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Update exam successfully").data(exam).build());
    }
    @DeleteMapping("/{examId}")
    public ResponseEntity<ResponseWrapper> deleteExam(@PathVariable Integer examId) {
        examService.deleteExam(examId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Delete exam successfully").build());
    }
    @PostMapping("/{examId}/publish")
    public ResponseEntity<ResponseWrapper> publishExam(@PathVariable Integer examId) {
        ExamDTO exam = examService.publishExam(examId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Publish exam successfully").data(exam).build());
    }
    @PostMapping("/{examId}/unpublish")
    public ResponseEntity<ResponseWrapper> unpublishExam(@PathVariable Integer examId) {
        ExamDTO exam = examService.unpublishExam(examId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Unpublish exam successfully").data(exam).build());
    }
    @PostMapping("/{examId}/questions/upload")
    public ResponseEntity<ResponseWrapper> importQuestions(
            @PathVariable Integer examId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        if (file.isEmpty()) {
            throw new HttpBadRequest("File upload trống.");
        }
        String fileName = file.getOriginalFilename();
        if (fileName == null || (!fileName.endsWith(".xlsx"))) {
            throw new HttpBadRequest("Chỉ chấp nhận file Excel (.xlsx).");
        }
        try {
            ImportResultDTO result = examService.importQuestionsFromExcel(examId, file, instructorId);
            String message = String.format("Import thành công %d câu hỏi.", result.getSuccessCount());
            if (result.getErrorCount() > 0) {
                message += String.format(" Có %d dòng bị lỗi.", result.getErrorCount());
            }
            return ResponseEntity.ok(ResponseWrapper.builder()
                    .status(HttpStatus.OK).code(HttpStatus.OK.value())
                    .message(message).data(result).build());
        } catch (Exception e) {
            log.error("Lỗi khi import câu hỏi cho exam {}: {}", examId, e.getMessage(), e);
            throw new HttpBadRequest("Đã xảy ra lỗi khi xử lý file: " + e.getMessage());
        }
    }
    @GetMapping("/available")
    public ResponseEntity<ResponseWrapper> getAvailableExams(Authentication authentication){
        Integer studentId = getCurrentUserId(authentication);
        List<ExamDTO> exams = examService.getAvailableExamsForStudent(studentId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Get available exams successfully").data(exams).build());
    }
    @GetMapping("/student/all")
    public ResponseEntity<ResponseWrapper> getAllStudentExams(
            Authentication authentication
    ) {
        Integer studentId = getCurrentUserId(authentication);
        List<ExamDTO> exams = examService.getAllExamsForStudent(studentId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Get all student exams successfully").data(exams).build());
    }
    @GetMapping("/{examId}/details")
    public ResponseEntity<ResponseWrapper> getExamDetails(
            @PathVariable Integer examId,
            Authentication authentication) {
        Integer studentId = getCurrentUserId(authentication);
        ExamDetailDTO exam = examService.getExamDetailsForStudent(examId, studentId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Get exam details successfully").data(exam).build());
    }
    @PostMapping("/submit")
    public ResponseEntity<ResponseWrapper> submitExam(
            @Valid @RequestBody ExamSubmissionDTO submission,
            Authentication authentication) {
        Integer studentId = getCurrentUserId(authentication);
        ExamResultDTO result = examService.submitExam(submission, studentId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Submit exam successfully").data(result).build());
    }
    @GetMapping("/{examId}/results")
    public ResponseEntity<ResponseWrapper> getExamResults (
            @PathVariable Integer examId,
            Authentication authentication) {
        Integer studentId = getCurrentUserId(authentication);
        List<ExamResultDTO> results = examService.getExamResults(examId, studentId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Get exam results successfully").data(results).build());
    }
    @GetMapping("/student/all-results")
    public ResponseEntity<ResponseWrapper> getAllMyExamResults(
            Authentication authentication
    ) {
        Integer studentId = getCurrentUserId(authentication);
        List<ExamResultDTO> results = examService.getAllMyExamResults(studentId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Get all student results successfully")
                .data(results).build());
    }
    @GetMapping("/{examId}/slots")
    public ResponseEntity<ResponseWrapper> getExamSlots(
            @PathVariable Integer examId) {
        List<ExamSlotDTO> results = examService.getExamSlots(examId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Get exam slots successfully").data(results).build());
    }
    @GetMapping("/{examId}/can-attempt")
    public ResponseEntity<ResponseWrapper> canAttemptExam(
            @PathVariable Integer examId,
            Authentication authentication) {
        Integer studentId = getCurrentUserId(authentication);
        boolean canAttempt = examService.canStudentAttemptExam(examId, studentId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Can attempt exam check completed").data(canAttempt).build());
    }
    @PostMapping("/{examId}/questions")
    public ResponseEntity<ResponseWrapper> addQuestionToExam(
            @PathVariable Integer examId,
            @Valid @RequestBody AddExamQuestionDTO questionDTO,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        ExamQuestionDTO question = examService.addQuestionToExam(examId, questionDTO, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.CREATED).code(HttpStatus.CREATED.value())
                .message("Add question to exam successfully").data(question).build());
    }
    @GetMapping("/{examId}/questions")
    public ResponseEntity<ResponseWrapper> getExamQuestions(
            @PathVariable Integer examId,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        List<ExamQuestionDTO> questions = examService.getExamQuestionsForInstructor(examId, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Get exam questions successfully").data(questions).build());
    }
    @PutMapping("/questions/{questionId}")
    public ResponseEntity<ResponseWrapper> updateExamQuestion(
            @PathVariable Integer questionId,
            @Valid @RequestBody UpdateExamQuestionDTO questionDTO,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        ExamQuestionDTO question = examService.updateExamQuestion(questionId, questionDTO, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Update exam question successfully").data(question).build());
    }
    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<ResponseWrapper> deleteExamQuestion(
            @PathVariable Integer questionId,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        examService.deleteExamQuestion(questionId, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Delete exam question successfully").build());
    }
    @GetMapping("/instructor/{examId}/submissions")
    public ResponseEntity<ResponseWrapper> getExamSubmissions(
            @PathVariable Integer examId,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        List<StudentSubmissionDTO> submissions = examService.getExamSubmissionsForInstructor(examId, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Get exam submissions successfully").data(submissions).build());
    }
    @GetMapping("/instructor/submissions/{resultId}")
    public ResponseEntity<ResponseWrapper> getSubmissionDetail(
            @PathVariable Integer resultId,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        StudentSubmissionDTO submission = examService.getSubmissionDetail(resultId, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Get submission detail successfully").data(submission).build());
    }
    @PostMapping("/instructor/submissions/{resultId}/grade")
    public ResponseEntity<ResponseWrapper> gradeSubmission(
            @PathVariable Integer resultId,
            @Valid @RequestBody GradeSubmissionDTO gradeDTO,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        StudentSubmissionDTO submission = examService.gradeSubmission(resultId, gradeDTO, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Grade submission successfully").data(submission).build());
    }
    @GetMapping("/instructor/{examId}/details")
    public ResponseEntity<ResponseWrapper> getExamDetailsForInstructor(
            @PathVariable Integer examId,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        ExamDTO exam = examService.getExamDetailsForInstructor(examId, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Get exam details for instructor successfully").data(exam).build());
    }

    // --- Student Exam Attempt Overrides ---
    @PostMapping("/{examId}/override/grant")
    public ResponseEntity<ResponseWrapper> grantExtraAttempt(
            @PathVariable Integer examId,
            @Valid @RequestBody GrantAttemptRequestDTO requestDTO,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        StudentExamAttemptOverrideDTO override = examService.grantExtraExamAttempt(
                examId, requestDTO.getStudentId(), instructorId, requestDTO.getExtraAttempts());
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Extra attempt granted successfully").data(override).build());
    }

    @DeleteMapping("/{examId}/override/revoke/{studentId}")
    public ResponseEntity<ResponseWrapper> revokeExtraAttempt(
            @PathVariable Integer examId,
            @PathVariable Integer studentId,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        examService.revokeExtraExamAttempt(examId, studentId, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Extra attempt revoked successfully").build());
    }

    @GetMapping("/{examId}/override")
    public ResponseEntity<ResponseWrapper> getStudentAttemptOverrides(
            @PathVariable Integer examId,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        List<StudentExamAttemptOverrideDTO> overrides = examService.getStudentAttemptOverrides(examId, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Student attempt overrides retrieved successfully").data(overrides).build());
    }

    @GetMapping("/{examId}/students")
    public ResponseEntity<ResponseWrapper> getStudentsInExamClass(
            @PathVariable Integer examId,
            Authentication authentication) {
        Integer instructorId = getCurrentUserId(authentication);
        List<StudentInfoDTO> students = examService.getStudentsInExamClass(examId, instructorId);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK).code(HttpStatus.OK.value())
                .message("Students in exam class retrieved successfully").data(students).build());
    }

    private Integer getCurrentUserId(Authentication authentication) {
        if(authentication != null && authentication.getPrincipal() instanceof MyUserDetails){
            MyUserDetails userDetails = (MyUserDetails) authentication.getPrincipal();
            return userDetails.getId();
        }
        throw new HttpBadRequest("User not authenticated or invalid principal type");
    }
}
