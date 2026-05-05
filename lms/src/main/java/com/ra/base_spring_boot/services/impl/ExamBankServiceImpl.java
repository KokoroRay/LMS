package com.ra.base_spring_boot.services.impl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.ra.base_spring_boot.dto.req.ExamBankQuestionRequestDTO;
import com.ra.base_spring_boot.dto.resp.ExamBankQuestionResponseDTO;
import com.ra.base_spring_boot.exception.HttpBadRequest;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.model.QuestionBank;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.QuestionType;
import com.ra.base_spring_boot.repository.QuestionBankRepository;
import com.ra.base_spring_boot.repository.UserRepository;
import com.ra.base_spring_boot.services.IExamBankService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
@Slf4j
@Service
@RequiredArgsConstructor
public class ExamBankServiceImpl implements IExamBankService {
    private final QuestionBankRepository questionBankRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    @Override
    @Transactional
    public QuestionBank saveQuestionToBank(ExamBankQuestionRequestDTO requestDTO, Integer creatorId) {
        log.info("Saving question to bank by user {}", creatorId);
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new HttpNotFound("Creator (User) not found with ID: " + creatorId));
        validateQuestionData(requestDTO);
        String choicesJson;
        String correctAnswersJson;
        try {
            List<String> choices = requestDTO.getChoices() != null ? requestDTO.getChoices() : Collections.emptyList();
            List<String> correctAnswers = requestDTO.getCorrectAnswers() != null ? requestDTO.getCorrectAnswers() : Collections.emptyList();
            if (requestDTO.getQuestionType() == QuestionType.TRUE_FALSE) {
                choices = List.of("True", "False");
                if (correctAnswers.size() != 1 || !choices.contains(correctAnswers.get(0))) {
                    throw new HttpBadRequest("Correct answer for TRUE_FALSE must be 'True' or 'False'.");
                }
            } else if (requestDTO.getQuestionType() == QuestionType.SHORT_ANSWER) {
                choices = Collections.emptyList();
                correctAnswers = Collections.emptyList();
            }
            choicesJson = objectMapper.writeValueAsString(choices);
            correctAnswersJson = objectMapper.writeValueAsString(correctAnswers);
        } catch (JsonProcessingException e) {
            log.error("Error converting choices/answers to JSON for exam bank save", e);
            throw new HttpBadRequest("Invalid format for choices or correct answers.");
        }
        QuestionBank questionBank = QuestionBank.builder()
                .questionText(requestDTO.getQuestionText())
                .questionType(requestDTO.getQuestionType())
                .choices(choicesJson)
                .correctAnswer(correctAnswersJson)
                .points(requestDTO.getPoints())
                .createdBy(creator)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        QuestionBank savedQuestion = questionBankRepository.save(questionBank);
        log.info("Question saved successfully to bank with ID: {}", savedQuestion.getQuestionId());
        return savedQuestion;
    }
    private void validateQuestionData(ExamBankQuestionRequestDTO dto) {
        QuestionType type = dto.getQuestionType();
        List<String> choices = dto.getChoices();
        List<String> answers = dto.getCorrectAnswers();
        if (type == QuestionType.MCQ || type == QuestionType.MULTI) {
            List<String> validChoices = choices != null ? choices : Collections.emptyList();
            List<String> validAnswers = answers != null ? answers : Collections.emptyList();
            if (validChoices.size() < 2) {
                throw new HttpBadRequest("MCQ/MULTI questions require at least 2 choices.");
            }
            if (validAnswers.isEmpty()) {
                throw new HttpBadRequest("MCQ/MULTI questions require at least 1 correct answer.");
            }
            for (String ans : validAnswers) {
                if (!validChoices.contains(ans)) {
                    throw new HttpBadRequest("Correct answer '" + ans + "' must be one of the choices.");
                }
            }
            if (type == QuestionType.MCQ && validAnswers.size() != 1) {
                throw new HttpBadRequest("MCQ question requires exactly 1 correct answer.");
            }
        }
    }
    @Override
    public Page<ExamBankQuestionResponseDTO> searchQuestions(String keyword, QuestionType type, Pageable pageable) {
        log.debug("Searching question bank with keyword '{}' and type '{}'", keyword, type);
        Page<QuestionBank> questionPage = questionBankRepository.searchByKeywordAndType(keyword, type, pageable);
        return questionPage.map(this::convertToResponseDTO);
    }
    private ExamBankQuestionResponseDTO convertToResponseDTO(QuestionBank qb) {
        List<String> choices = parseJsonList(qb.getChoices());
        List<String> correctAnswers = parseJsonList(qb.getCorrectAnswer());
        return ExamBankQuestionResponseDTO.builder()
                .questionId(qb.getQuestionId())
                .questionText(qb.getQuestionText())
                .questionType(qb.getQuestionType())
                .points(qb.getPoints())
                .choices(choices)
                .correctAnswers(correctAnswers)
                .createdByUsername(qb.getCreatedBy() != null ? qb.getCreatedBy().getUsername() : "N/A")
                .createdAt(qb.getCreatedAt())
                .build();
    }
    private List<String> parseJsonList(String jsonString) {
        if (jsonString == null || jsonString.isBlank() || jsonString.equals("[]")) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(jsonString, new TypeReference<ArrayList<String>>() {});
        } catch (JsonProcessingException e) {
            log.error("Error parsing JSON string to List: {}", jsonString, e);
            return List.of("[Error parsing JSON: " + e.getMessage() + "]");
        }
    }
}