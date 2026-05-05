package com.ra.base_spring_boot.services.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ra.base_spring_boot.dto.*;
import com.ra.base_spring_boot.exception.BadRequestException;
import com.ra.base_spring_boot.exception.ResourceNotFoundException;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
public class SurveyServiceImpl implements SurveyService {

    private final SurveyRepository surveyRepository;
    private final SurveyQuestionRepository questionRepository;
    private final SurveyResponseRepository responseRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    // -------------------- SURVEY --------------------
    @Override
    public SurveyDTO createSurvey(SurveyDTO surveyDTO) {
        if (surveyDTO.getTitle() == null || surveyDTO.getTitle().isBlank())
            throw new BadRequestException("Survey title cannot be empty");

        Integer currentUserId = null;
        if (SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof MyUserDetails) {
            MyUserDetails userDetails = (MyUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            currentUserId = userDetails.getId();
        }

        Survey survey = Survey.builder()
                .title(surveyDTO.getTitle())
                .description(surveyDTO.getDescription())
                .classId(surveyDTO.getClassId())
                .courseId(surveyDTO.getCourseId())
                .createdBy(currentUserId) // Use current user's ID
                .createdAt(LocalDateTime.now())
                .isActive(true)
                .build();

        Survey saved = surveyRepository.save(survey);
        surveyDTO.setSurveyId(saved.getSurveyId());
        surveyDTO.setCreatedAt(saved.getCreatedAt());
        surveyDTO.setIsActive(saved.getIsActive());

        return surveyDTO;
    }

    @Override
    public SurveyDTO updateSurvey(Integer surveyId, SurveyDTO surveyDTO) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found with id: " + surveyId));

        survey.setTitle(Optional.ofNullable(surveyDTO.getTitle()).orElseThrow(() -> new BadRequestException("Title cannot be null")));
        survey.setDescription(surveyDTO.getDescription());
        survey.setClassId(surveyDTO.getClassId());
        survey.setCourseId(surveyDTO.getCourseId());

        surveyRepository.save(survey);
        return getSurveyById(surveyId);
    }

    @Override
    public void deleteSurvey(Integer surveyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found"));
        surveyRepository.delete(survey);
    }

    @Override
    public SurveyDTO getSurveyById(Integer surveyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found"));
        return toSurveyDTO(survey);
    }

    @Override
    public SurveyDTO getSurveyByCourseId(Integer courseId) {
        Survey survey = surveyRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("No survey found for course id: " + courseId));
        return toSurveyDTO(survey);
    }

    @Override
    public List<SurveyDTO> getAllSurveys(Boolean isActive) {
        return surveyRepository.findByIsActive(isActive)
                .stream().map(this::toSurveyDTO)
                .collect(Collectors.toList());
    }

    @Override
    public SurveyDTO activateSurvey(Integer surveyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found"));
        survey.setIsActive(true);
        surveyRepository.save(survey);
        return toSurveyDTO(survey);
    }

    @Override
    public SurveyDTO deactivateSurvey(Integer surveyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found"));
        survey.setIsActive(false);
        surveyRepository.save(survey);
        return toSurveyDTO(survey);
    }

    private SurveyDTO toSurveyDTO(Survey survey) {
        return SurveyDTO.builder()
                .surveyId(survey.getSurveyId())
                .title(survey.getTitle())
                .description(survey.getDescription())
                .classId(survey.getClassId())
                .courseId(survey.getCourseId())
                .createdBy(survey.getCreatedBy())
                .createdAt(survey.getCreatedAt())
                .isActive(survey.getIsActive())
                .build();
    }

    // -------------------- QUESTION --------------------
    @Override
    public SurveyQuestionDTO addQuestion(Integer surveyId, SurveyQuestionDTO questionDTO) {
        if (questionDTO.getQuestionText() == null || questionDTO.getQuestionText().isBlank())
            throw new BadRequestException("Question text cannot be empty");

        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found"));

        SurveyQuestion question = SurveyQuestion.builder()
                .survey(survey)
                .questionText(questionDTO.getQuestionText())
                .questionType(Enum.valueOf(SurveyQuestion.QuestionType.class, questionDTO.getQuestionType()))
                .options(toJson(questionDTO.getOptions()))
                .build();

        return toQuestionDTO(questionRepository.save(question));
    }

    @Override
    public SurveyQuestionDTO updateQuestion(SurveyQuestionDTO questionDTO) {
        SurveyQuestion question = questionRepository.findById(questionDTO.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        question.setQuestionText(Optional.ofNullable(questionDTO.getQuestionText())
                .orElseThrow(() -> new BadRequestException("Question text cannot be null")));
        question.setQuestionType(Enum.valueOf(SurveyQuestion.QuestionType.class, questionDTO.getQuestionType()));
        question.setOptions(toJson(questionDTO.getOptions()));

        return toQuestionDTO(questionRepository.save(question));
    }

    @Override
    public void deleteQuestion(Integer questionId) {
        SurveyQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        questionRepository.delete(question);
    }

    @Override
    public List<SurveyQuestionDTO> getQuestionsBySurvey(Integer surveyId) {
        return questionRepository.findBySurvey_SurveyId(surveyId)
                .stream().map(this::toQuestionDTO)
                .collect(Collectors.toList());
    }

    private SurveyQuestionDTO toQuestionDTO(SurveyQuestion question) {
        List<String> optionsList = null;
        try {
            if (question.getOptions() != null)
                optionsList = mapper.readValue(question.getOptions(), new TypeReference<List<String>>() {});
        } catch (Exception e) { e.printStackTrace(); }

        return SurveyQuestionDTO.builder()
                .questionId(question.getQuestionId())
                .surveyId(question.getSurvey().getSurveyId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType().name())
                .options(optionsList)
                .build();
    }

    private String toJson(Object obj) {
        try { return mapper.writeValueAsString(obj); }
        catch (Exception e) { e.printStackTrace(); return "{}"; }
    }

    // -------------------- RESPONSE --------------------
    @Override
    public List<SurveyResponseDTO> submitResponses(List<SurveyResponseDTO> responseDTOs) {
        if (responseDTOs == null || responseDTOs.isEmpty()) {
            throw new BadRequestException("Response list cannot be empty.");
        }

        // Get current user from security context
        Integer studentId;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof MyUserDetails) {
            studentId = ((MyUserDetails) principal).getId();
        } else {
            // Or throw an exception if user must be authenticated
            throw new BadRequestException("User not authenticated.");
        }

        // All responses should be for the same survey
        Integer surveyId = responseDTOs.get(0).getSurveyId();

        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found with id: " + surveyId));

        if (!survey.getIsActive()) {
            throw new BadRequestException("This survey is not currently active.");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        // Enrollment check
        if (survey.getCourseId() != null) {
            boolean enrolled = enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), survey.getCourseId());
            if (!enrolled) {
                throw new BadRequestException("Student not enrolled in the required course for this survey.");
            }
        } else if (survey.getClassId() != null) {
            boolean enrolled = enrollmentRepository.existsByStudentIdAndClassEntityClassId(
                    student.getId(), survey.getClassId());
            if (!enrolled) {
                throw new BadRequestException("Student not enrolled in the required class for this survey.");
            }
        }

        List<SurveyResponse> responsesToSave = new ArrayList<>();
        for (SurveyResponseDTO dto : responseDTOs) {
            SurveyQuestion question = questionRepository.findById(dto.getQuestionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + dto.getQuestionId()));

            SurveyResponse response = SurveyResponse.builder()
                    .survey(survey)
                    .question(question)
                    .student(student)
                    .answer(dto.getAnswer())
                    .submittedAt(LocalDateTime.now())
                    .build();
            responsesToSave.add(response);
        }

        List<SurveyResponse> savedResponses = responseRepository.saveAll(responsesToSave);

        return savedResponses.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public SurveyResponseDTO updateResponse(SurveyResponseDTO responseDTO) {
        SurveyResponse response = responseRepository.findById(responseDTO.getResponseId())
                .orElseThrow(() -> new ResourceNotFoundException("Response not found"));

        if (!response.getStudent().getId().equals(responseDTO.getStudentId()))
            throw new BadRequestException("Student mismatch: cannot update this response");

        Survey survey = response.getSurvey();
        if (!survey.getIsActive())
            throw new BadRequestException("This survey is not currently active.");

        response.setAnswer(responseDTO.getAnswer());
        response.setUpdatedAt(LocalDateTime.now());

        SurveyResponse saved = responseRepository.save(response);
        return toResponseDTO(saved);
    }

    @Override
    public List<SurveyResponseDTO> getResponsesBySurvey(Integer surveyId) {
        return responseRepository.findBySurvey_SurveyId(surveyId)
                .stream().map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<SurveyResponseDTO> getResponsesByUser(Integer studentId) {
        return responseRepository.findByStudent_Id(studentId)
                .stream().map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public boolean hasUserEvaluatedCourse(Integer courseId) {
        // Get current user from security context
        Integer studentId;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof MyUserDetails) {
            studentId = ((MyUserDetails) principal).getId();
        } else {
            // Or throw an exception if user must be authenticated
            throw new BadRequestException("User not authenticated.");
        }
        return responseRepository.existsBySurvey_CourseIdAndStudent_Id(courseId, studentId);
    }

    private SurveyResponseDTO toResponseDTO(SurveyResponse response) {
        return SurveyResponseDTO.builder()
                .responseId(response.getResponseId())
                .surveyId(response.getSurvey().getSurveyId())
                .questionId(response.getQuestion().getQuestionId())
                .studentId(response.getStudent().getId())
                .answer(response.getAnswer())
                .submittedAt(response.getSubmittedAt())
                .updatedAt(response.getUpdatedAt())
                .build();
    }

    // -------------------- STATISTICS --------------------
    @Override
    public List<SurveyStatisticsDTO> getSurveyStatistics(Integer surveyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found"));

        return questionRepository.findBySurvey_SurveyId(surveyId).stream().map(q -> {
            List<SurveyResponse> responses = responseRepository.findByQuestion_QuestionId(q.getQuestionId());

            Map<String, Integer> optionCounts = new HashMap<>();
            if (q.getQuestionType() != SurveyQuestion.QuestionType.TEXT) {
                optionCounts = responses.stream()
                        .flatMap(r -> r.getAnswer() != null ? Arrays.stream(r.getAnswer().split(",")) : Stream.<String>empty())
                        .collect(Collectors.toMap(ans -> ans, ans -> 1, Integer::sum));
            }

            return SurveyStatisticsDTO.builder()
                    .surveyId(survey.getSurveyId())
                    .surveyTitle(survey.getTitle())
                    .classId(survey.getClassId())
                    .questionId(q.getQuestionId())
                    .questionText(q.getQuestionText())
                    .questionType(q.getQuestionType().name())
                    .optionCounts(optionCounts)
                    .totalResponses(responses.size())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<SurveyStatisticsDTO> getSurveyStatisticsByClass(Integer surveyId, Integer classId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new ResourceNotFoundException("Survey not found"));

        return questionRepository.findBySurvey_SurveyId(surveyId).stream().map(q -> {
            List<SurveyResponse> responses = responseRepository.findByQuestion_QuestionId(q.getQuestionId()).stream()
                    .filter(r -> enrollmentRepository.existsByStudentIdAndClassEntityClassId(r.getStudent().getId(), classId))
                    .collect(Collectors.toList());

            Map<String, Integer> optionCounts = new HashMap<>();
            if (q.getQuestionType() != SurveyQuestion.QuestionType.TEXT) {
                optionCounts = responses.stream()
                        .flatMap(r -> r.getAnswer() != null ? Arrays.stream(r.getAnswer().split(",")) : Stream.<String>empty())
                        .collect(Collectors.toMap(ans -> ans, ans -> 1, Integer::sum));
            }

            return SurveyStatisticsDTO.builder()
                    .surveyId(survey.getSurveyId())
                    .surveyTitle(survey.getTitle())
                    .classId(classId)
                    .questionId(q.getQuestionId())
                    .questionText(q.getQuestionText())
                    .questionType(q.getQuestionType().name())
                    .optionCounts(optionCounts)
                    .totalResponses(responses.size())
                    .build();
        }).collect(Collectors.toList());
    }
}
