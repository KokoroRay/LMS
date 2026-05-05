package com.ra.base_spring_boot.controller;


import com.ra.base_spring_boot.dto.QuestionBankDTO;
import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.model.QuestionBank;
import com.ra.base_spring_boot.model.QuestionTag;
import com.ra.base_spring_boot.model.constants.Difficulty;
import com.ra.base_spring_boot.model.constants.QuestionStatus;
import com.ra.base_spring_boot.services.IQuestionBankService;
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
import java.util.Set;

@RestController
@RequestMapping("/question-bank")
@RequiredArgsConstructor
public class QuestionBankController {

    private final IQuestionBankService questionBankService;

    @GetMapping
    public ResponseEntity<ResponseWrapper<Page<QuestionBank>>> getAllQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Sort sort = sortDirection.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<QuestionBank> questionBanks = questionBankService.getAllQuestions(pageable);
        return ResponseEntity.ok(ResponseWrapper.<Page<QuestionBank>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Questions retrieved successfully")
                .data(questionBanks)
                .build());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ResponseWrapper<Page<QuestionBank>>> getQuestionById(
            @PathVariable QuestionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<QuestionBank> questionBanks = questionBankService.getQuestionsByStatus(status, pageable);
        return ResponseEntity.ok(ResponseWrapper.<Page<QuestionBank>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Questions retrieved successfully")
                .data(questionBanks)
                .build());
    }

    @GetMapping("/search")
    public ResponseEntity<ResponseWrapper<Page<QuestionBank>>> searchQuestions(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "ACTIVE") QuestionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<QuestionBank> questionBanks = questionBankService.searchQuestions(keyword, status, pageable);
        return ResponseEntity.ok(ResponseWrapper.<Page<QuestionBank>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Questions retrieved successfully")
                .data(questionBanks)
                .build());
    }

    @GetMapping("/difficulty/{difficulty}")
    public ResponseEntity<ResponseWrapper<Page<QuestionBank>>> getQuestionsByDifficulty(
            @PathVariable Difficulty difficulty,
            @RequestParam(defaultValue = "ACTIVE") QuestionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<QuestionBank> questionBanks = questionBankService.getQuestionsByDifficulty(difficulty, status, pageable);
        return ResponseEntity.ok(ResponseWrapper.<Page<QuestionBank>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Questions retrieved successfully")
                .data(questionBanks)
                .build());
    }

    @GetMapping("/tags")
    public ResponseEntity<ResponseWrapper<Page<QuestionBank>>> getQuestionsByTags(
            @RequestParam Set<Integer> tagIds,
            @RequestParam(defaultValue = "ACTIVE") QuestionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<QuestionBank> questionBanks = questionBankService.getQuestionsByTags(tagIds, status, pageable);
        return ResponseEntity.ok(ResponseWrapper.<Page<QuestionBank>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Questions retrieved successfully")
                .data(questionBanks)
                .build());
    }

    @GetMapping("/{questionId}")
    public ResponseEntity<ResponseWrapper<QuestionBank>> getQuestionById(
            @PathVariable Integer questionId) {
        QuestionBank questionBank = questionBankService.getQuestionById(questionId);
        return ResponseEntity.ok(ResponseWrapper.<QuestionBank>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Question retrieved successfully")
                .data(questionBank)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_USER')")
    public  ResponseEntity<ResponseWrapper<QuestionBank>> createQuestion(@Valid @RequestBody QuestionBankDTO questionBankDTO) {
        QuestionBank createQuestion = questionBankService.createQuestion(questionBankDTO);
        return ResponseEntity.ok(ResponseWrapper.<QuestionBank>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Question created successfully")
                .data(createQuestion)
                .build());
    }

    @PutMapping("/{questionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_USER')")
    public ResponseEntity<ResponseWrapper<QuestionBank>> updateQuestion(
            @PathVariable Integer questionId,
            @Valid @RequestBody QuestionBankDTO questionBankDTO) {
        QuestionBank updateQuestion = questionBankService.updateQuestion(questionId, questionBankDTO);
        return ResponseEntity.ok(ResponseWrapper.<QuestionBank>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Question updated successfully")
                .data(updateQuestion)
                .build());
    }
    @DeleteMapping("/{questionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<Void>> deleteQuestion(@PathVariable Integer questionId) {
        questionBankService.deleteQuestion(questionId);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Question deleted successfully")
                .build());
    }

    @GetMapping("/user/{userId}/count")
    public ResponseEntity<ResponseWrapper<Long>> countQuestionsByUser(@PathVariable Integer userId) {
        long count = questionBankService.countQuestionsByUser(userId);
        return ResponseEntity.ok(ResponseWrapper.<Long>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Count questions successfully")
                .data(count)
                .build());
    }

}
