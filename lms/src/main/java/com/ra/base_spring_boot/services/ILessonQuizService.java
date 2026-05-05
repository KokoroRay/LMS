package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.lesson.*;

import java.util.List;

/**
 * Service xử lý logic quiz trong lesson cho sinh viên
 */
public interface ILessonQuizService {

    /**
     * Lấy thông tin lesson kèm quiz (để sinh viên làm bài)
     * @param lessonId ID của lesson
     * @param studentId ID của sinh viên
     * @param includeHistory Include lịch sử làm bài không
     * @return LessonWithQuizDTO
     */
    LessonWithQuizDTO getLessonWithQuiz(Integer lessonId, Integer studentId, boolean includeHistory);

    /**
     * Bắt đầu làm quiz (tạo attempt mới)
     * @param lessonId ID của lesson
     * @param studentId ID của sinh viên
     * @return LessonQuizAttemptDTO
     */
    LessonQuizAttemptDTO startQuiz(Integer lessonId, Integer studentId);

    /**
     * Lưu câu trả lời (auto-save trong khi làm bài)
     * @param attemptId ID của attempt
     * @param answerSubmission Câu trả lời
     * @return LessonQuizAnswerDTO
     */
    LessonQuizAnswerDTO saveAnswer(Integer attemptId, LessonQuizAnswerSubmissionDTO answerSubmission);

    /**
     * Submit toàn bộ bài quiz
     * @param submitDTO DTO chứa attemptId và các câu trả lời
     * @param studentId ID sinh viên (để verify quyền)
     * @return LessonQuizAttemptDTO với kết quả chấm điểm
     */
    LessonQuizAttemptDTO submitQuiz(SubmitLessonQuizDTO submitDTO, Integer studentId);

    /**
     * Lấy kết quả attempt cụ thể
     * @param attemptId ID của attempt
     * @param studentId ID sinh viên (để verify quyền)
     * @param includeAnswers Include chi tiết các câu trả lời không
     * @return LessonQuizAttemptDTO
     */
    LessonQuizAttemptDTO getAttemptResult(Integer attemptId, Integer studentId, boolean includeAnswers);

    /**
     * Lấy lịch sử làm bài của sinh viên trong lesson
     * @param lessonId ID của lesson
     * @param studentId ID của sinh viên
     * @return List<LessonQuizAttemptDTO>
     */
    List<LessonQuizAttemptDTO> getStudentAttemptHistory(Integer lessonId, Integer studentId);

    /**
     * Lấy attempt tốt nhất của sinh viên
     * @param lessonId ID của lesson
     * @param studentId ID của sinh viên
     * @return LessonQuizAttemptDTO hoặc null nếu chưa có
     */
    LessonQuizAttemptDTO getBestAttempt(Integer lessonId, Integer studentId);

    /**
     * Kiểm tra sinh viên có đang làm quiz chưa
     * @param lessonId ID của lesson
     * @param studentId ID của sinh viên
     * @return true nếu có attempt IN_PROGRESS
     */
    boolean hasOngoingAttempt(Integer lessonId, Integer studentId);

    /**
     * Tiếp tục attempt đang làm dở
     * @param lessonId ID của lesson
     * @param studentId ID của sinh viên
     * @return LessonQuizAttemptDTO của attempt IN_PROGRESS
     */
    LessonQuizAttemptDTO continueAttempt(Integer lessonId, Integer studentId);

    /**
     * Thống kê số sinh viên đã làm quiz
     * @param lessonId ID của lesson
     * @return số lượng sinh viên
     */
    long countStudentsCompleted(Integer lessonId);

    /**
     * Chấm lại điểm cho attempt (cho trường hợp manual grading)
     * @param attemptId ID của attempt
     * @return LessonQuizAttemptDTO updated
     */
    LessonQuizAttemptDTO regradeAttempt(Integer attemptId);
}
