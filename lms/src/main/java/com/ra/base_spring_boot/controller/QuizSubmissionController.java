package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.AnswerResultDTO;
import com.ra.base_spring_boot.dto.AnswerSubmissionDTO;
import com.ra.base_spring_boot.services.ILessonQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/quiz")
@RequiredArgsConstructor
public class QuizSubmissionController {

    private final ILessonQuestionService lessonQuestionService;
    @PostMapping("/submit")
    public ResponseEntity<AnswerResultDTO> submitQuizAnswers(
            @RequestBody AnswerSubmissionDTO submissionDTO) {
        AnswerResultDTO result = lessonQuestionService.calculateScoreForSubmission(submissionDTO);

        return ResponseEntity.ok(result);
    }
}
