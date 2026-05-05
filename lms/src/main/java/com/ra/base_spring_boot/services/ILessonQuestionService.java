package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.AddQuestionsToLessonDTO;
import com.ra.base_spring_boot.dto.LessonQuestionDTO;
import com.ra.base_spring_boot.model.LessonQuestion;

import java.util.List;

public interface ILessonQuestionService {

    List<LessonQuestion> getQuestionsByLesson(Integer lessonId);
    /**
     * Fetch a list of questions from the question bank for a lesson context.
     * If count is null or greater than available, return all matching questions.
     * If shuffle is true, the returned list is randomized.
     */
    List<LessonQuestion> getQuestionsFromBank(Integer lessonId, Integer count, boolean shuffle);
    LessonQuestion addQuestionToLesson(LessonQuestionDTO lessonQuestionDTO);
    void addMultipleQuestionsToLesson(AddQuestionsToLessonDTO addQuestionsToLessonDTO);
    void removeQuestionFromLesson(Integer lessonId, Integer questionId);
    void updateQuestionOrder(Integer lessonQuestionId, Integer newOrder);
    long countQuestionsInLesson(Integer lessonId);

    /**
     * Calculate score for submitted answers. Returns a simple DTO describing total and max points.
     */
    com.ra.base_spring_boot.dto.AnswerResultDTO calculateScoreForSubmission(com.ra.base_spring_boot.dto.AnswerSubmissionDTO submissionDTO);

    /**
     * Persist a submission that was generated from question bank (not existing LessonQuestion rows).
     * This will create an attempt, create missing LessonQuestion rows (if needed), persist answers,
     * grade the attempt and return a LessonQuizAttemptDTO describing the saved attempt.
     */
    com.ra.base_spring_boot.dto.lesson.LessonQuizAttemptDTO submitAndSaveFromBank(com.ra.base_spring_boot.dto.AnswerSubmissionDTO submissionDTO, Integer studentId);

    // New methods for updating questions
    void updateQuestion(com.ra.base_spring_boot.dto.QuestionUpdateDTO questionUpdateDTO);
    void updateLessonQuestionDetails(Integer lessonQuestionId, Boolean isRequired);

    List<com.ra.base_spring_boot.dto.lesson.LessonQuizAttemptDTO> getAttempts(Integer lessonId, Integer studentId, Integer attemptNumber);
}
