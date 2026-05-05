package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.ExamDTO;
import com.ra.base_spring_boot.dto.ExamQuestionDTO;
import com.ra.base_spring_boot.dto.ExamSlotDTO;
import com.ra.base_spring_boot.dto.req.AddExamQuestionDTO;
import com.ra.base_spring_boot.dto.req.ExamRequestDTO;
import com.ra.base_spring_boot.dto.req.ExamSubmissionDTO;
import com.ra.base_spring_boot.dto.req.GradeSubmissionDTO;
import com.ra.base_spring_boot.dto.req.UpdateExamQuestionDTO;
import com.ra.base_spring_boot.dto.resp.ExamDetailDTO;
import com.ra.base_spring_boot.dto.resp.ExamResultDTO;
import com.ra.base_spring_boot.dto.resp.StudentSubmissionDTO;
import com.ra.base_spring_boot.dto.resp.StudentExamAttemptOverrideDTO;
import com.ra.base_spring_boot.dto.resp.StudentInfoDTO;
import org.springframework.data.domain.Page;
import java.util.List;
import com.ra.base_spring_boot.dto.resp.ImportResultDTO;
import org.springframework.web.multipart.MultipartFile;

public interface IExamService {
    Page<ExamDTO> getExamByClass(Integer classId, int page, int size);
    ExamDTO createExam(ExamRequestDTO examRequestDTO, Integer instructorId);
    ExamDTO updateExam(Integer examId, ExamRequestDTO examRequestDTO, Integer instructorId);
    void deleteExam(Integer examId);
    ExamDTO publishExam(Integer examId);
    ExamDTO unpublishExam(Integer examId);
    List<ExamDTO> getAvailableExamsForStudent(Integer studentId);
    List<ExamDTO> getAllExamsForStudent(Integer studentId);
    ExamDetailDTO getExamDetailsForStudent(Integer examId, Integer studentId);
    ExamResultDTO submitExam(ExamSubmissionDTO submissionDTO, Integer studentId);
    List<ExamResultDTO> getExamResults(Integer examId, Integer studentId);
    List<ExamSlotDTO> getExamSlots(Integer examId);
    boolean canStudentAttemptExam(Integer examId, Integer studentId);
    ExamQuestionDTO addQuestionToExam(Integer examId, AddExamQuestionDTO questionDTO, Integer instructorId);
    List<ExamQuestionDTO> getExamQuestionsForInstructor(Integer examId, Integer instructorId);
    ExamQuestionDTO updateExamQuestion(Integer questionId, UpdateExamQuestionDTO questionDTO, Integer instructorId);
    void deleteExamQuestion(Integer questionId, Integer instructorId);
    List<StudentSubmissionDTO> getExamSubmissionsForInstructor(Integer examId, Integer instructorId);
    StudentSubmissionDTO getSubmissionDetail(Integer resultId, Integer instructorId);
    StudentSubmissionDTO gradeSubmission(Integer resultId, GradeSubmissionDTO gradeDTO, Integer instructorId);
    ExamDTO getExamDetailsForInstructor(Integer examId, Integer instructorId);
    ImportResultDTO importQuestionsFromExcel(Integer examId, MultipartFile file, Integer instructorId);
    List<ExamResultDTO> getAllMyExamResults(Integer studentId);
    List<ExamDTO> getAllExams();

    // Student Exam Attempt Overrides
    StudentExamAttemptOverrideDTO grantExtraExamAttempt(Integer examId, Integer studentId, Integer instructorId, Integer extraAttempts);
    void revokeExtraExamAttempt(Integer examId, Integer studentId, Integer instructorId);
    List<StudentExamAttemptOverrideDTO> getStudentAttemptOverrides(Integer examId, Integer instructorId);

    List<StudentInfoDTO> getStudentsInExamClass(Integer examId, Integer instructorId);
    
    // ⭐ LUỒNG MỚI: Kiểm tra quyền làm lại bài kiểm tra
    boolean canRetakeExam(Integer examId, Integer studentId);
}