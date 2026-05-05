package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.QuestionBankDTO;
import com.ra.base_spring_boot.model.QuestionBank;
import com.ra.base_spring_boot.model.QuestionTag;
import com.ra.base_spring_boot.model.constants.Difficulty;
import com.ra.base_spring_boot.model.constants.QuestionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;

public interface IQuestionBankService {

    Page<QuestionBank> getAllQuestions(Pageable pageable);

    Page<QuestionBank> getQuestionsByStatus(QuestionStatus status, Pageable pageable);

    Page<QuestionBank> searchQuestions(String keyword, QuestionStatus questionStatus,Pageable pageable);

    Page<QuestionBank> getQuestionsByDifficulty(Difficulty difficulty, QuestionStatus questionStatus, Pageable pageable);

    Page<QuestionBank> getQuestionsByTags(Set<Integer> tagIds, QuestionStatus questionStatus, Pageable pageable);

    QuestionBank getQuestionById(Integer id);

    QuestionBank createQuestion(QuestionBankDTO questionBankDTO);

    QuestionBank updateQuestion(Integer id, QuestionBankDTO questionBankDTO);

    void deleteQuestion(Integer id);

    long countQuestionsByUser(Integer id);
    public List<QuestionTag> addTagsToQuestion(Integer questionId, List<Integer> tagIds);

    public List<QuestionTag> removeTagsFromQuestion(Integer questionId, List<Integer> tagIds);

    public List<QuestionTag> getQuestionTags(Integer questionId);


    }
