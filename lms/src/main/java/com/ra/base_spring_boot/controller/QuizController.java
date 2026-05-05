package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.quiz.*;
import com.ra.base_spring_boot.services.IQuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final IQuizService quizService;


    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<QuizDTO>> createQuiz(@Valid @RequestBody QuizDTO quizDTO) {
        QuizDTO created = quizService.createQuiz(quizDTO);
        return ResponseEntity.ok(ResponseWrapper.<QuizDTO>builder()
                .status(HttpStatus.CREATED)
                .code(HttpStatus.CREATED.value())
                .message("Quiz created successfully")
                .data(created)
                .build());
    }

    @PutMapping("/{quizId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<QuizDTO>> updateQuiz(
            @PathVariable Integer quizId,
            @Valid @RequestBody QuizDTO quizDTO) {
        QuizDTO updated = quizService.updateQuiz(quizId, quizDTO);
        return ResponseEntity.ok(ResponseWrapper.<QuizDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Quiz updated successfully")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{quizId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<Void>> deleteQuiz(@PathVariable Integer quizId) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Quiz deleted successfully")
                .build());
    }

    @GetMapping("/{quizId}")
    public ResponseEntity<ResponseWrapper<QuizDTO>> getQuizById(@PathVariable Integer quizId) {
        QuizDTO quiz = quizService.getQuizById(quizId);
        return ResponseEntity.ok(ResponseWrapper.<QuizDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Quiz retrieved successfully")
                .data(quiz)
                .build());
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<ResponseWrapper<List<QuizDTO>>> getQuizzesByClass(@PathVariable Integer classId) {
        List<QuizDTO> quizzes = quizService.getAllQuizzesByClass(classId);
        return ResponseEntity.ok(ResponseWrapper.<List<QuizDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Quizzes retrieved successfully")
                .data(quizzes)
                .build());
    }


    @GetMapping("/class/{classId}/available")
    public ResponseEntity<ResponseWrapper<List<QuizDTO>>> getAvailableQuizzes(@PathVariable Integer classId) {
        List<QuizDTO> quizzes = quizService.getAvailableQuizzesByClass(classId);
        return ResponseEntity.ok(ResponseWrapper.<List<QuizDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Available quizzes retrieved successfully")
                .data(quizzes)
                .build());
    }

    @GetMapping
    public ResponseEntity<ResponseWrapper<Page<QuizDTO>>> getAllQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "quizId") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {

        Sort sort = sortDirection.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<QuizDTO> quizzes = quizService.getAllQuizzes(pageable);
        return ResponseEntity.ok(ResponseWrapper.<Page<QuizDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Quizzes retrieved successfully")
                .data(quizzes)
                .build());
    }

    @PostMapping("/{quizId}/start")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<ResponseWrapper<QuizAttemptDTO>> startQuiz(
            @PathVariable Integer quizId,
            @RequestParam Integer studentId) {
        // Pass a default attemptNumber of 1 for standalone quizzes
        QuizAttemptDTO attempt = quizService.startQuiz(quizId, studentId, 1);
        return ResponseEntity.ok(ResponseWrapper.<QuizAttemptDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Quiz started successfully")
                .data(attempt)
                .build());
    }


    @PostMapping("/attempts/{attemptId}/submit")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<ResponseWrapper<QuizAttemptDTO>> submitQuiz(
            @PathVariable Integer attemptId,
            @Valid @RequestBody SubmitQuizDTO submitQuizDTO) {
        QuizAttemptDTO result = quizService.submitQuiz(attemptId, submitQuizDTO);
        return ResponseEntity.ok(ResponseWrapper.<QuizAttemptDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Quiz submitted successfully")
                .data(result)
                .build());
    }


    @GetMapping("/attempts/{attemptId}")
    public ResponseEntity<ResponseWrapper<QuizAttemptDTO>> getAttempt(@PathVariable Integer attemptId) {
        QuizAttemptDTO attempt = quizService.getAttemptById(attemptId);
        return ResponseEntity.ok(ResponseWrapper.<QuizAttemptDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Attempt retrieved successfully")
                .data(attempt)
                .build());
    }

    @GetMapping("/student/{studentId}/attempts")
    public ResponseEntity<ResponseWrapper<List<QuizAttemptDTO>>> getStudentAttempts(
            @PathVariable Integer studentId) {
        List<QuizAttemptDTO> attempts = quizService.getStudentAttempts(studentId);
        return ResponseEntity.ok(ResponseWrapper.<List<QuizAttemptDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Student attempts retrieved successfully")
                .data(attempts)
                .build());
    }

    @GetMapping("/{quizId}/attempts")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<List<QuizAttemptDTO>>> getQuizAttempts(
            @PathVariable Integer quizId) {
        List<QuizAttemptDTO> attempts = quizService.getQuizAttempts(quizId);
        return ResponseEntity.ok(ResponseWrapper.<List<QuizAttemptDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Quiz attempts retrieved successfully")
                .data(attempts)
                .build());
    }

    @PostMapping("/attempts/{attemptId}/grade")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<QuizAttemptDTO>> gradeAttempt(@PathVariable Integer attemptId) {
        QuizAttemptDTO graded = quizService.gradeAttempt(attemptId);
        return ResponseEntity.ok(ResponseWrapper.<QuizAttemptDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Attempt graded successfully")
                .data(graded)
                .build());
    }

    @GetMapping("/{quizId}/stats")
    public ResponseEntity<ResponseWrapper<Long>> getQuizStats(@PathVariable Integer quizId) {
        Long count = quizService.countAttemptsByQuiz(quizId);
        return ResponseEntity.ok(ResponseWrapper.<Long>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Quiz statistics retrieved successfully")
                .data(count)
                .build());
    }
    @GetMapping("/{quizId}/questions")
    public ResponseEntity<ResponseWrapper<List<QuizQuestionDTO>>> getQuizQuestions(
            @PathVariable Integer quizId) {
        List<QuizQuestionDTO> questions = quizService.getQuizQuestions(quizId);
        return ResponseEntity.ok(ResponseWrapper.<List<QuizQuestionDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Quiz questions retrieved successfully")
                .data(questions)
                .build());
    }

    @PostMapping("/{quizId}/questions/from-bank")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<QuizQuestionDTO>> addQuestionFromBank(
            @PathVariable Integer quizId,
            @Valid @RequestBody AddQuestionFromBankDTO dto) {
        QuizQuestionDTO added = quizService.addQuestionFromBank(quizId, dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseWrapper.<QuizQuestionDTO>builder()
                        .status(HttpStatus.CREATED)
                        .code(HttpStatus.CREATED.value())
                        .message("Question added to quiz successfully")
                        .data(added)
                        .build());
    }

    @PostMapping("/{quizId}/questions/custom")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<QuizQuestionDTO>> createCustomQuestion(
            @PathVariable Integer quizId,
            @Valid @RequestBody QuizQuestionDTO dto) {
        QuizQuestionDTO created = quizService.createCustomQuestion(quizId, dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseWrapper.<QuizQuestionDTO>builder()
                        .status(HttpStatus.CREATED)
                        .code(HttpStatus.CREATED.value())
                        .message("Custom question created successfully")
                        .data(created)
                        .build());
    }

    @PutMapping("/{quizId}/questions/{questionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<QuizQuestionDTO>> updateQuizQuestion(
            @PathVariable Integer quizId,
            @PathVariable Integer questionId,
            @Valid @RequestBody QuizQuestionDTO dto) {
        QuizQuestionDTO updated = quizService.updateQuizQuestion(quizId, questionId, dto);
        return ResponseEntity.ok(ResponseWrapper.<QuizQuestionDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Quiz question updated successfully")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{quizId}/questions/{questionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<Void>> deleteQuizQuestion(
            @PathVariable Integer quizId,
            @PathVariable Integer questionId) {
        quizService.deleteQuizQuestion(quizId, questionId);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Quiz question deleted successfully")
                .build());
    }

    @PostMapping("/{quizId}/questions/batch")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<List<QuizQuestionDTO>>> batchAddQuestions(
            @PathVariable Integer quizId,
            @Valid @RequestBody BatchAddQuestionsDTO dto) {
        List<QuizQuestionDTO> added = quizService.batchAddQuestionsFromBank(quizId, dto);
        return ResponseEntity.ok(ResponseWrapper.<List<QuizQuestionDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Questions added to quiz successfully")
                .data(added)
                .build());
    }

    @PutMapping("/{quizId}/questions/{questionId}/points")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<QuizQuestionDTO>> updateQuestionPoints(
            @PathVariable Integer quizId,
            @PathVariable Integer questionId,
            @Valid @RequestBody UpdateQuestionPointsDTO dto) {
        QuizQuestionDTO updated = quizService.updateQuestionPoints(quizId, questionId, dto);
        return ResponseEntity.ok(ResponseWrapper.<QuizQuestionDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Question points updated successfully")
                .data(updated)
                .build());
    }
}
