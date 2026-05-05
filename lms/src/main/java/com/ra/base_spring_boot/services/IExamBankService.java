package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.req.ExamBankQuestionRequestDTO;
import com.ra.base_spring_boot.dto.resp.ExamBankQuestionResponseDTO;
import com.ra.base_spring_boot.model.QuestionBank;
import com.ra.base_spring_boot.model.constants.QuestionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IExamBankService {

    QuestionBank saveQuestionToBank(ExamBankQuestionRequestDTO requestDTO, Integer creatorId);
    Page<ExamBankQuestionResponseDTO> searchQuestions(String keyword, QuestionType type, Pageable pageable);
}