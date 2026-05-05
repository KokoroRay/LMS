package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.AddQuestionsToLessonDTO;
import com.ra.base_spring_boot.dto.LessonQuestionDTO;
import com.ra.base_spring_boot.dto.AnswerSubmissionDTO;
import com.ra.base_spring_boot.dto.AnswerResultDTO;
import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.model.LessonQuestion;
import com.ra.base_spring_boot.services.ILessonQuestionService;
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
public class LessonQuestionController {

    private final ILessonQuestionService lessonQuestionService;

        @GetMapping("/{lessonId}/questions")
        public ResponseEntity<ResponseWrapper<List<LessonQuestion>>> getLessonQuestions(
                        @PathVariable Integer lessonId,
                        @RequestParam(required = false, defaultValue = "false") boolean fromBank,
                        @RequestParam(required = false) Integer count,
                        @RequestParam(required = false, defaultValue = "false") boolean shuffle) {
                List<LessonQuestion> questions;
                if (fromBank) {
                        questions = lessonQuestionService.getQuestionsFromBank(lessonId, count, shuffle);
                } else {
                        questions = lessonQuestionService.getQuestionsByLesson(lessonId);
                }
                return ResponseEntity.ok(ResponseWrapper.<List<LessonQuestion>>builder()
                                .status(HttpStatus.OK)
                                .code(HttpStatus.OK.value())
                                .message("Get questions successfully")
                                .data(questions)
                                .build());
        }

    @PostMapping("/{lessonId}/questions")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<LessonQuestion>> addQuestionToLesson(
            @PathVariable Integer lessonId,
            @Valid @RequestBody LessonQuestionDTO lessonQuestionDTO) {
        lessonQuestionDTO.setLessonId(lessonId);
        LessonQuestion addedQuestion = lessonQuestionService.addQuestionToLesson(lessonQuestionDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseWrapper.<LessonQuestion>builder()
                .status(HttpStatus.CREATED)
                .code(HttpStatus.CREATED.value())
                .message("Add question successfully")
                .data(addedQuestion )
                .build()
        );
    }

    @PostMapping("/{lessonId}/questions/batch")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<Void>> addMultipleQuestionsToLesson(
            @PathVariable Integer lessonId,
            @Valid @RequestBody AddQuestionsToLessonDTO addQuestionsDTO) {
        addQuestionsDTO.setLessonId(lessonId);
        lessonQuestionService.addMultipleQuestionsToLesson(addQuestionsDTO);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Add questions successfully")
                .build());
    }

        @DeleteMapping("/{lessonId}/questions/{questionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<Void>> removeQuestionFromLesson(
            @PathVariable Integer lessonId,
                        @PathVariable Integer questionId) {
                lessonQuestionService.removeQuestionFromLesson(lessonId, questionId);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Remove question successfully")
                .build());
    }

        @PostMapping("/{lessonId}/questions/submit")
        public ResponseEntity<ResponseWrapper<AnswerResultDTO>> submitAnswers(
                        @PathVariable Integer lessonId,
                        @RequestBody AnswerSubmissionDTO submissionDTO) {
                submissionDTO.setLessonId(lessonId);
                AnswerResultDTO result = lessonQuestionService.calculateScoreForSubmission(submissionDTO);
                return ResponseEntity.ok(ResponseWrapper.<AnswerResultDTO>builder()
                                .status(HttpStatus.OK)
                                .code(HttpStatus.OK.value())
                                .message("Scoring completed")
                                .data(result)
                                .build());
        }

                @PostMapping("/{lessonId}/questions/submit-and-save")
                @PreAuthorize("hasAuthority('ROLE_USER')")
                public ResponseEntity<ResponseWrapper<com.ra.base_spring_boot.dto.lesson.LessonQuizAttemptDTO>> submitAndSaveFromBank(
                                @PathVariable Integer lessonId,
                                @RequestBody AnswerSubmissionDTO submissionDTO,
                                Authentication authentication) {
                        // ensure lessonId is set
                        submissionDTO.setLessonId(lessonId);
                        Integer studentId = getCurrentUserId(authentication);
                        com.ra.base_spring_boot.dto.lesson.LessonQuizAttemptDTO result =
                                        lessonQuestionService.submitAndSaveFromBank(submissionDTO, studentId);
                        return ResponseEntity.ok(ResponseWrapper.<com.ra.base_spring_boot.dto.lesson.LessonQuizAttemptDTO>builder()
                                        .status(HttpStatus.OK)
                                        .code(HttpStatus.OK.value())
                                                                        .message("Submission saved and graded successfully")
                                                                        .data(result)
                                                                        .build());
                                                        }
                                        
                                                        @GetMapping("/{lessonId}/attempts")
                                                        @PreAuthorize("hasAuthority('ROLE_USER')")
                                                        public ResponseEntity<ResponseWrapper<List<com.ra.base_spring_boot.dto.lesson.LessonQuizAttemptDTO>>> getAttempts(
                                                                        @PathVariable Integer lessonId,
                                                                        @RequestParam(required = false) Integer attemptNumber,
                                                                        Authentication authentication) {
                                                                Integer studentId = getCurrentUserId(authentication);
                                                                List<com.ra.base_spring_boot.dto.lesson.LessonQuizAttemptDTO> results =
                                                                                lessonQuestionService.getAttempts(lessonId, studentId, attemptNumber);
                                                                return ResponseEntity.ok(ResponseWrapper.<List<com.ra.base_spring_boot.dto.lesson.LessonQuizAttemptDTO>>builder()
                                                                                .status(HttpStatus.OK)
                                                                                .code(HttpStatus.OK.value())
                                                                                .message("Get attempts successfully")
                                                                                .data(results)
                                                                                .build());
                                                        }
                                        
                                                        private Integer getCurrentUserId(Authentication authentication) {
                                                                if (authentication != null && authentication.getPrincipal() instanceof com.ra.base_spring_boot.security.principle.MyUserDetails) {
                                                                        com.ra.base_spring_boot.security.principle.MyUserDetails userDetails = (com.ra.base_spring_boot.security.principle.MyUserDetails) authentication.getPrincipal();
                                                                        return userDetails.getId();                        }
                        throw new RuntimeException("User not authenticated");
                }

    @PutMapping("/questions/{lessonQuestionId}/order")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<Void>> updateQuestionOrder(
            @PathVariable Integer lessonQuestionId,
            @RequestParam Integer newOrder) {
        lessonQuestionService.updateQuestionOrder(lessonQuestionId, newOrder);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Update question order successfully")
                .build());
    }

    @PutMapping("/questions/bank/{questionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<Void>> updateQuestionBankDetails(
            @PathVariable Integer questionId,
            @Valid @RequestBody com.ra.base_spring_boot.dto.QuestionUpdateDTO questionUpdateDTO) {
        questionUpdateDTO.setQuestionId(questionId); // Ensure ID consistency
        lessonQuestionService.updateQuestion(questionUpdateDTO);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Question bank details updated successfully")
                .build());
    }

    @PutMapping("/questions/{lessonQuestionId}/details")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<Void>> updateLessonQuestionDetails(
            @PathVariable Integer lessonQuestionId,
            @RequestParam Boolean isRequired) {
        lessonQuestionService.updateLessonQuestionDetails(lessonQuestionId, isRequired);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Lesson question details updated successfully")
                .build());
    }

    @GetMapping("/{lessonId}/questions/count")
    public ResponseEntity<ResponseWrapper<Long>> countQuestionsInLesson(
            @RequestParam Integer lessonId) {
        long count = lessonQuestionService.countQuestionsInLesson(lessonId);
        return ResponseEntity.ok(ResponseWrapper.<Long>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Count questions in lesson successfully")
                .data(count)
                .build());
    }

}
