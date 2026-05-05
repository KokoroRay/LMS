package com.ra.base_spring_boot.controller;
import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.req.ExamBankQuestionRequestDTO;
import com.ra.base_spring_boot.dto.resp.ExamBankQuestionResponseDTO;
import com.ra.base_spring_boot.exception.HttpBadRequest;
import com.ra.base_spring_boot.model.QuestionBank;
import com.ra.base_spring_boot.model.constants.QuestionType;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.IExamBankService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
@Slf4j
@RestController
@RequestMapping("/exam-bank")
@RequiredArgsConstructor
public class ExamBankController {
    private final IExamBankService examBankService;
    @PostMapping
    public ResponseEntity<ResponseWrapper> saveQuestionToBank(
            @Valid @RequestBody ExamBankQuestionRequestDTO requestDTO,
            Authentication authentication) {
        Integer creatorId = getCurrentUserId(authentication);
        QuestionBank savedQuestion = examBankService.saveQuestionToBank(requestDTO, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseWrapper.builder()
                .status(HttpStatus.CREATED).code(HttpStatus.CREATED.value())
                .message("Question saved to exam bank successfully")
                .data(savedQuestion)
                .build());
    }
    @GetMapping
    public ResponseEntity<ResponseWrapper> searchQuestions(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) QuestionType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort
    ) {
        try {
            List<Sort.Order> orders = new ArrayList<>();
            if (sort[0].contains(",")) {
                for (String sortOrder : sort) {
                    String[] _sort = sortOrder.split(",");
                    if (_sort.length == 2) {
                        orders.add(new Sort.Order(getSortDirection(_sort[1]), _sort[0]));
                    } else {
                        log.warn("Invalid sort parameter format ignored: {}", sortOrder);
                    }
                }
            } else if (sort.length == 2) {
                orders.add(new Sort.Order(getSortDirection(sort[1]), sort[0]));
            } else {
                log.warn("Invalid or incomplete sort parameter format ignored: {}", String.join(",", sort));
                orders.add(new Sort.Order(Sort.Direction.DESC, "createdAt"));
            }
            if (orders.isEmpty()) {
                orders.add(new Sort.Order(Sort.Direction.DESC, "createdAt"));
            }
            Pageable pageable = PageRequest.of(page, size, Sort.by(orders));
            Page<ExamBankQuestionResponseDTO> questionPage = examBankService.searchQuestions(keyword, type, pageable);
            return ResponseEntity.ok(ResponseWrapper.builder()
                    .status(HttpStatus.OK).code(HttpStatus.OK.value())
                    .message("Searched questions successfully")
                    .data(questionPage)
                    .build());
        } catch (IllegalArgumentException e) {
            log.error("Invalid sorting parameter detected: {}", String.join(",", sort), e);
            throw new HttpBadRequest("Invalid sorting parameter: " + e.getMessage());
        }
    }
    private Sort.Direction getSortDirection(String direction) {
        if ("asc".equalsIgnoreCase(direction)) {
            return Sort.Direction.ASC;
        } else {
            return Sort.Direction.DESC;
        }
    }
    private Integer getCurrentUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof MyUserDetails) {
            MyUserDetails userDetails = (MyUserDetails) authentication.getPrincipal();
            return userDetails.getId();
        }
        throw new HttpBadRequest("User not authenticated or invalid principal type");
    }
}
