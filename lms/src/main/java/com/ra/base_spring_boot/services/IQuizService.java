package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.quiz.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IQuizService {

    // CRUD operations
    QuizDTO createQuiz(QuizDTO quizDTO);

    QuizDTO updateQuiz(Integer quizId, QuizDTO quizDTO);

    void deleteQuiz(Integer quizId);

    QuizDTO getQuizById(Integer quizId);

    List<QuizDTO> getAllQuizzesByClass(Integer classId);

    List<QuizDTO> getAvailableQuizzesByClass(Integer classId);

    Page<QuizDTO> getAllQuizzes(Pageable pageable);

    // Quiz attempt operations
    QuizAttemptDTO startQuiz(Integer quizId, Integer studentId, Integer attemptNumber);

    QuizAttemptDTO submitQuiz(Integer attemptId, SubmitQuizDTO submitQuizDTO);

    QuizAttemptDTO getAttemptById(Integer attemptId);

    List<QuizAttemptDTO> getStudentAttempts(Integer studentId);

    List<QuizAttemptDTO> getQuizAttempts(Integer quizId);

    // Grading
    QuizAttemptDTO gradeAttempt(Integer attemptId);

    // Statistics
    Long countQuizzesByClass(Integer classId);

    Long countAttemptsByQuiz(Integer quizId);

    // Quiz Question Management
    List<QuizQuestionDTO> getQuizQuestions(Integer quizId);

    QuizQuestionDTO addQuestionFromBank(Integer quizId, AddQuestionFromBankDTO dto);

    QuizQuestionDTO createCustomQuestion(Integer quizId, QuizQuestionDTO dto);



    QuizQuestionDTO updateQuizQuestion(Integer quizId, Integer questionId, QuizQuestionDTO dto);

    void deleteQuizQuestion(Integer quizId, Integer questionId);

    List<QuizQuestionDTO> batchAddQuestionsFromBank(Integer quizId, BatchAddQuestionsDTO dto);

    QuizQuestionDTO updateQuestionPoints(Integer quizId, Integer questionId, UpdateQuestionPointsDTO dto);

    QuizAttemptDTO getLatestAttempt(Integer quizId, Integer studentId, Integer attemptNumber);
}
