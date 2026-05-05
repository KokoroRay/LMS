package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.lesson.*;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.ILessonQuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/lessons")
@RequiredArgsConstructor
public class LessonQuizController {

    private final ILessonQuizService lessonQuizService;


    @GetMapping("/{lessonId}/quiz")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<ResponseWrapper<LessonWithQuizDTO>> getLessonWithQuiz(
            @PathVariable Integer lessonId,
            @RequestParam(defaultValue = "false") boolean includeHistory,
            Authentication authentication) {

        Integer studentId = getCurrentUserId(authentication);
        LessonWithQuizDTO data = lessonQuizService.getLessonWithQuiz(lessonId, studentId, includeHistory);

        return ResponseEntity.ok(ResponseWrapper.<LessonWithQuizDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get lesson with quiz successfully")
                .data(data)
                .build());
    }


    @PostMapping("/{lessonId}/quiz/start")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<ResponseWrapper<LessonQuizAttemptDTO>> startQuiz(
            @PathVariable Integer lessonId,
            Authentication authentication) {

        Integer studentId = getCurrentUserId(authentication);
        LessonQuizAttemptDTO data = lessonQuizService.startQuiz(lessonId, studentId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseWrapper.<LessonQuizAttemptDTO>builder()
                        .status(HttpStatus.CREATED)
                        .code(HttpStatus.CREATED.value())
                        .message("Quiz started successfully")
                        .data(data)
                        .build());
    }


    @PostMapping("/quiz/attempts/{attemptId}/answers")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<ResponseWrapper<LessonQuizAnswerDTO>> saveAnswer(
            @PathVariable Integer attemptId,
            @Valid @RequestBody LessonQuizAnswerSubmissionDTO answerSubmission) {

        LessonQuizAnswerDTO data = lessonQuizService.saveAnswer(attemptId, answerSubmission);

        return ResponseEntity.ok(ResponseWrapper.<LessonQuizAnswerDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Answer saved successfully")
                .data(data)
                .build());
    }


    @PostMapping("/quiz/submit")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<ResponseWrapper<LessonQuizAttemptDTO>> submitQuiz(
            @Valid @RequestBody SubmitLessonQuizDTO submitDTO,
            Authentication authentication) {

        Integer studentId = getCurrentUserId(authentication);
        LessonQuizAttemptDTO data = lessonQuizService.submitQuiz(submitDTO, studentId);

        return ResponseEntity.ok(ResponseWrapper.<LessonQuizAttemptDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Quiz submitted and graded successfully")
                .data(data)
                .build());
    }

    @GetMapping("/quiz/attempts/{attemptId}")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<ResponseWrapper<LessonQuizAttemptDTO>> getAttemptResult(
            @PathVariable Integer attemptId,
            @RequestParam(defaultValue = "true") boolean includeAnswers,
            Authentication authentication) {

        Integer studentId = getCurrentUserId(authentication);
        LessonQuizAttemptDTO data = lessonQuizService.getAttemptResult(attemptId, studentId, includeAnswers);

        return ResponseEntity.ok(ResponseWrapper.<LessonQuizAttemptDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get attempt result successfully")
                .data(data)
                .build());
    }


    @GetMapping("/{lessonId}/quiz/history")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<ResponseWrapper<List<LessonQuizAttemptDTO>>> getAttemptHistory(
            @PathVariable Integer lessonId,
            Authentication authentication) {

        Integer studentId = getCurrentUserId(authentication);
        List<LessonQuizAttemptDTO> data = lessonQuizService.getStudentAttemptHistory(lessonId, studentId);

        return ResponseEntity.ok(ResponseWrapper.<List<LessonQuizAttemptDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get attempt history successfully")
                .data(data)
                .build());
    }


    @GetMapping("/{lessonId}/quiz/best-attempt")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<ResponseWrapper<LessonQuizAttemptDTO>> getBestAttempt(
            @PathVariable Integer lessonId,
            Authentication authentication) {

        Integer studentId = getCurrentUserId(authentication);
        LessonQuizAttemptDTO data = lessonQuizService.getBestAttempt(lessonId, studentId);

        return ResponseEntity.ok(ResponseWrapper.<LessonQuizAttemptDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message(data != null ? "Get best attempt successfully" : "No attempts found")
                .data(data)
                .build());
    }


    @GetMapping("/{lessonId}/quiz/ongoing")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<ResponseWrapper<Boolean>> hasOngoingAttempt(
            @PathVariable Integer lessonId,
            Authentication authentication) {

        Integer studentId = getCurrentUserId(authentication);
        boolean hasOngoing = lessonQuizService.hasOngoingAttempt(lessonId, studentId);

        return ResponseEntity.ok(ResponseWrapper.<Boolean>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message(hasOngoing ? "You have an ongoing attempt" : "No ongoing attempt")
                .data(hasOngoing)
                .build());
    }


    @GetMapping("/{lessonId}/quiz/continue")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<ResponseWrapper<LessonQuizAttemptDTO>> continueAttempt(
            @PathVariable Integer lessonId,
            Authentication authentication) {

        Integer studentId = getCurrentUserId(authentication);
        LessonQuizAttemptDTO data = lessonQuizService.continueAttempt(lessonId, studentId);

        return ResponseEntity.ok(ResponseWrapper.<LessonQuizAttemptDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Continue attempt successfully")
                .data(data)
                .build());
    }

    @GetMapping("/{lessonId}/quiz/stats")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<Long>> getQuizStats(
            @PathVariable Integer lessonId) {

        long count = lessonQuizService.countStudentsCompleted(lessonId);

        return ResponseEntity.ok(ResponseWrapper.<Long>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get quiz statistics successfully")
                .data(count)
                .build());
    }


    @PostMapping("/quiz/attempts/{attemptId}/regrade")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<LessonQuizAttemptDTO>> regradeAttempt(
            @PathVariable Integer attemptId) {

        LessonQuizAttemptDTO data = lessonQuizService.regradeAttempt(attemptId);

        return ResponseEntity.ok(ResponseWrapper.<LessonQuizAttemptDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Attempt regraded successfully")
                .data(data)
                .build());
    }


    private Integer getCurrentUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof MyUserDetails) {
            MyUserDetails userDetails = (MyUserDetails) authentication.getPrincipal();
            return userDetails.getId();
        }
        throw new RuntimeException("User not authenticated");
    }
}
