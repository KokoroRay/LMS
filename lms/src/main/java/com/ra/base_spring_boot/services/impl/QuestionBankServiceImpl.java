package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.QuestionBankDTO;
import com.ra.base_spring_boot.model.QuestionBank;
import com.ra.base_spring_boot.model.QuestionTag;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.Difficulty;
import com.ra.base_spring_boot.model.constants.QuestionStatus;
import com.ra.base_spring_boot.repository.LessonQuestionRepository;
import com.ra.base_spring_boot.repository.QuestionBankRepository;
import com.ra.base_spring_boot.repository.QuestionTagRepository;
import com.ra.base_spring_boot.repository.UserRepository;
import com.ra.base_spring_boot.services.IQuestionBankService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class QuestionBankServiceImpl implements IQuestionBankService {

    private final LessonQuestionRepository lessonQuestionRepository;

    private final QuestionBankRepository questionBankRepository;

    private final QuestionTagRepository questionTagRepository;
    private final UserRepository userRepository;

    @Override
    public Page<QuestionBank> getAllQuestions(Pageable pageable) {
        return questionBankRepository.findAll(pageable);
    }

    @Override
    public Page<QuestionBank> getQuestionsByStatus(QuestionStatus status, Pageable pageable) {
        return questionBankRepository.findByStatus(status, pageable);
    }

    @Override
    public Page<QuestionBank> searchQuestions(String keyword, QuestionStatus questionStatus, Pageable pageable) {
        return questionBankRepository.searchByKeyword(keyword, questionStatus, pageable);
    }

    @Override
    public Page<QuestionBank> getQuestionsByDifficulty(Difficulty difficulty, QuestionStatus questionStatus, Pageable pageable) {
        return questionBankRepository.findByDifficultyAndStatus(difficulty, questionStatus, pageable);
    }

    @Override
    public Page<QuestionBank> getQuestionsByTags(Set<Integer> tagIds, QuestionStatus questionStatus, Pageable pageable) {
        return questionBankRepository.findByTagIdsAndStatus(tagIds, questionStatus, pageable );
    }

    @Override
    public QuestionBank getQuestionById(Integer id) {
        return questionBankRepository.findById(id).
                orElseThrow(() -> new RuntimeException("Question not found"));
    }

    @Override
    @Transactional
    public QuestionBank createQuestion(QuestionBankDTO questionBankDTO) {
        User createdBy = userRepository.findById(questionBankDTO.getCreatedBy())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Set<QuestionTag> tags = new HashSet<>();
        if (questionBankDTO.getTagIds() != null) {
            tags = new HashSet<>(questionTagRepository.findAllById(questionBankDTO.getTagIds()));
        }
        QuestionBank questionBank = QuestionBank.builder()
                .questionText(questionBankDTO.getQuestionText())
                .questionType(questionBankDTO.getQuestionType())
                .difficulty(questionBankDTO.getDifficulty())
                .points(questionBankDTO.getPoints())
                .choices(questionBankDTO.getChoices())
                .correctAnswer(questionBankDTO.getCorrectAnswer())
                .explanation(questionBankDTO.getExplanation())
                .status(questionBankDTO.getStatus())
                .createdBy(createdBy)
                .tags(tags)
                .build();
        return questionBankRepository.save(questionBank);
    }

    @Override
    @Transactional
    public QuestionBank updateQuestion(Integer id, QuestionBankDTO questionBankDTO) {
        QuestionBank existingQuestion = getQuestionById(id);
        Set<QuestionTag> tags = new HashSet<>();
        if (questionBankDTO.getTagIds() != null) {
            tags = new HashSet<>(questionTagRepository.findAllById(questionBankDTO.getTagIds()));
        }
        existingQuestion.setQuestionText(questionBankDTO.getQuestionText());
        existingQuestion.setQuestionType(questionBankDTO.getQuestionType());
        existingQuestion.setDifficulty(questionBankDTO.getDifficulty());
        existingQuestion.setPoints(questionBankDTO.getPoints());
        existingQuestion.setChoices(questionBankDTO.getChoices());
        existingQuestion.setCorrectAnswer(questionBankDTO.getCorrectAnswer());
        existingQuestion.setExplanation(questionBankDTO.getExplanation());
        existingQuestion.setStatus(questionBankDTO.getStatus());
        existingQuestion.setTags(tags);
        return questionBankRepository.save(existingQuestion);
    }

    @Override
    @Transactional
    public void deleteQuestion(Integer id) {
        QuestionBank questionBank = getQuestionById(id);
        questionBankRepository.delete(questionBank);
    }

    @Override
    public long countQuestionsByUser(Integer id) {
        return questionBankRepository.countByUser(id);
    }


    //bổ sung để hỗ trợ add tối hơn phần tag cho câu hỏi
    @Override
    public List<QuestionTag> addTagsToQuestion(Integer questionId, List<Integer> tagIds) {
        QuestionBank questionBank = getQuestionById(questionId);
        Set<QuestionTag> tags = new HashSet<>(questionTagRepository.findAllById(tagIds));
        questionBank.getTags().addAll(tags);
        questionBankRepository.save(questionBank);
        return new ArrayList<>(questionBank.getTags());
    }

    @Override
    public List<QuestionTag> removeTagsFromQuestion(Integer questionId, List<Integer> tagIds) {
        QuestionBank questionBank = getQuestionById(questionId);
        Set<QuestionTag> tags = new HashSet<>(questionTagRepository.findAllById(tagIds));
        questionBank.getTags().removeAll(tags);
        questionBankRepository.save(questionBank);
        return new ArrayList<>(questionBank.getTags());
    }

    @Override
    public List<QuestionTag> getQuestionTags(Integer questionId) {
        QuestionBank questionBank = getQuestionById(questionId);
        return new ArrayList<>(questionBank.getTags());
    }


}
