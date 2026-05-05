package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.SurveyDTO;
import com.ra.base_spring_boot.dto.SurveyQuestionDTO;
import com.ra.base_spring_boot.dto.SurveyResponseDTO;
import com.ra.base_spring_boot.dto.SurveyStatisticsDTO;
import com.ra.base_spring_boot.services.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/surveys")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    // -------------------- SURVEY --------------------

    @PostMapping
    public SurveyDTO createSurvey(@RequestBody SurveyDTO dto) {
        return surveyService.createSurvey(dto);
    }

    @PutMapping("/{surveyId}")
    public SurveyDTO updateSurvey(@PathVariable Integer surveyId,
                                  @RequestBody SurveyDTO dto) {
        return surveyService.updateSurvey(surveyId, dto);
    }

    @DeleteMapping("/{surveyId}")
    public void deleteSurvey(@PathVariable Integer surveyId) {
        surveyService.deleteSurvey(surveyId);
    }

    @GetMapping("/{surveyId}")
    public SurveyDTO getSurvey(@PathVariable Integer surveyId) {
        return surveyService.getSurveyById(surveyId);
    }

    @GetMapping
    public List<SurveyDTO> getAllSurveys(@RequestParam(required = false) Boolean isActive) {
        if (isActive == null) isActive = true; // default active
        return surveyService.getAllSurveys(isActive);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<SurveyDTO> getSurveyByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(surveyService.getSurveyByCourseId(courseId));
    }

    @GetMapping("/course/{courseId}/has-evaluated")
    public ResponseEntity<Boolean> hasUserEvaluatedCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(surveyService.hasUserEvaluatedCourse(courseId));
    }

    @PutMapping("/{surveyId}/activate")
    public SurveyDTO activateSurvey(@PathVariable Integer surveyId) {
        return surveyService.activateSurvey(surveyId);
    }

    @PutMapping("/{surveyId}/deactivate")
    public SurveyDTO deactivateSurvey(@PathVariable Integer surveyId) {
        return surveyService.deactivateSurvey(surveyId);
    }

    // -------------------- QUESTIONS --------------------

    @PostMapping("/{surveyId}/questions")
    public SurveyQuestionDTO addQuestion(@PathVariable Integer surveyId,
                                         @RequestBody SurveyQuestionDTO dto) {
        return surveyService.addQuestion(surveyId, dto);
    }

    @PutMapping("/questions/{questionId}")
    public SurveyQuestionDTO updateQuestion(@PathVariable Integer questionId,
                                            @RequestBody SurveyQuestionDTO dto) {
        dto.setQuestionId(questionId);
        return surveyService.updateQuestion(dto);
    }

    @DeleteMapping("/questions/{questionId}")
    public void deleteQuestion(@PathVariable Integer questionId) {
        surveyService.deleteQuestion(questionId);
    }

    @GetMapping("/{surveyId}/questions")
    public List<SurveyQuestionDTO> getQuestionsBySurvey(@PathVariable Integer surveyId) {
        return surveyService.getQuestionsBySurvey(surveyId);
    }

    // -------------------- RESPONSES --------------------

    @PostMapping("/responses")
    public ResponseEntity<List<SurveyResponseDTO>> submitResponses(@RequestBody List<SurveyResponseDTO> responseDTOs) {
        return ResponseEntity.ok(surveyService.submitResponses(responseDTOs));
    }

    @PutMapping("/responses/{responseId}")
    public ResponseEntity<SurveyResponseDTO> updateResponse(@PathVariable Integer responseId,
                                                            @RequestBody SurveyResponseDTO responseDTO) {
        responseDTO.setResponseId(responseId);
        return ResponseEntity.ok(surveyService.updateResponse(responseDTO));
    }

    @GetMapping("/{surveyId}/responses")
    public ResponseEntity<List<SurveyResponseDTO>> getResponsesBySurvey(@PathVariable Integer surveyId) {
        return ResponseEntity.ok(surveyService.getResponsesBySurvey(surveyId));
    }

    @GetMapping("/responses/student/{studentId}")
    public ResponseEntity<List<SurveyResponseDTO>> getResponsesByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(surveyService.getResponsesByUser(studentId));
    }

    // -------------------- STATISTICS --------------------

    @GetMapping("/{surveyId}/statistics")
    public ResponseEntity<List<SurveyStatisticsDTO>> getSurveyStatistics(@PathVariable Integer surveyId) {
        return ResponseEntity.ok(surveyService.getSurveyStatistics(surveyId));
    }

    @GetMapping("/{surveyId}/statistics/class/{classId}")
    public ResponseEntity<List<SurveyStatisticsDTO>> getSurveyStatisticsByClass(@PathVariable Integer surveyId,
                                                                                @PathVariable Integer classId) {
        return ResponseEntity.ok(surveyService.getSurveyStatisticsByClass(surveyId, classId));
    }
}
