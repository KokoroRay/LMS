package com.ra.base_spring_boot.services.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ra.base_spring_boot.dto.quiz.*;
import com.ra.base_spring_boot.events.GradeUpdatedEvent;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.QuizAttemptStatus;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.IQuizService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements IQuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final QuestionBankRepository questionBankRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public QuizDTO createQuiz(QuizDTO quizDTO) {
        ClassEntity classEntity = classRepository.findById(quizDTO.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));

        Quiz quiz = Quiz.builder()
                .classEntity(classEntity)
                .title(quizDTO.getTitle())
                .description(quizDTO.getDescription())
                .totalMarks(quizDTO.getTotalMarks() != null ? quizDTO.getTotalMarks() : 100)
                .durationMinutes(quizDTO.getDurationMinutes() != null ? quizDTO.getDurationMinutes() : 0)
                .startTime(quizDTO.getStartTime())
                .endTime(quizDTO.getEndTime())
                .isPublished(quizDTO.getIsPublished() != null ? quizDTO.getIsPublished() : false)
                .build();

        quiz = quizRepository.save(quiz);

        if (quizDTO.getQuestions() != null && !quizDTO.getQuestions().isEmpty()) {
            for (QuizQuestionDTO questionDTO : quizDTO.getQuestions()) {
                QuizQuestion question = QuizQuestion.builder()
                        .quiz(quiz)
                        .questionText(questionDTO.getQuestionText())
                        .questionType(questionDTO.getQuestionType())
                        .points(questionDTO.getPoints() != null ? questionDTO.getPoints() : 1.0)
                        .choices(questionDTO.getChoices())
                        .correctAnswer(questionDTO.getCorrectAnswer())
                        .build();
                quizQuestionRepository.save(question);
            }
        }

        return mapToDTO(quiz);
    }

    @Override
    @Transactional
    public QuizDTO updateQuiz(Integer quizId, QuizDTO quizDTO) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        quiz.setTitle(quizDTO.getTitle());
        quiz.setDescription(quizDTO.getDescription());
        quiz.setTotalMarks(quizDTO.getTotalMarks());
        quiz.setDurationMinutes(quizDTO.getDurationMinutes());
        quiz.setStartTime(quizDTO.getStartTime());
        quiz.setEndTime(quizDTO.getEndTime());
        quiz.setIsPublished(quizDTO.getIsPublished());

        if (quizDTO.getQuestions() != null) {

            quizQuestionRepository.deleteByQuiz_QuizId(quizId);

            for (QuizQuestionDTO questionDTO : quizDTO.getQuestions()) {
                QuizQuestion question = QuizQuestion.builder()
                        .quiz(quiz)
                        .questionText(questionDTO.getQuestionText())
                        .questionType(questionDTO.getQuestionType())
                        .points(questionDTO.getPoints() != null ? questionDTO.getPoints() : 1.0)
                        .choices(questionDTO.getChoices())
                        .correctAnswer(questionDTO.getCorrectAnswer())
                        .build();
                quizQuestionRepository.save(question);
            }
        }

        quiz = quizRepository.save(quiz);
        return mapToDTO(quiz);
    }

    @Override
    @Transactional
    public void deleteQuiz(Integer quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        quizRepository.delete(quiz);
    }

    @Override
    public QuizDTO getQuizById(Integer quizId) {
        Quiz quiz = quizRepository.findByIdWithQuestions(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        return mapToDTO(quiz);
    }

    @Override
    public List<QuizDTO> getAllQuizzesByClass(Integer classId) {
        List<Quiz> quizzes = quizRepository.findByClassEntity_ClassId(classId);
        return quizzes.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<QuizDTO> getAvailableQuizzesByClass(Integer classId) {
        List<Quiz> quizzes = quizRepository.findAvailableQuizzesByClass(classId, LocalDateTime.now());
        return quizzes.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Page<QuizDTO> getAllQuizzes(Pageable pageable) {
        return quizRepository.findAll(pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional
    public QuizAttemptDTO startQuiz(Integer quizId, Integer studentId, Integer attemptNumber) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (!quiz.isAvailable()) {
            throw new RuntimeException("Quiz is not available");
        }

        // Allow starting a new attempt only if there are no "IN_PROGRESS" ones for the same attempt number
        Integer finalAttemptNumber = attemptNumber != null ? attemptNumber : 1;
        quizAttemptRepository.findTopByQuiz_QuizIdAndStudent_IdAndAttemptNumberOrderByStartedAtDesc(
                quizId, studentId, finalAttemptNumber
        ).ifPresent(attempt -> {
            if (attempt.getStatus() == QuizAttemptStatus.IN_PROGRESS) {
                throw new RuntimeException("You already have an in-progress attempt for this session.");
            }
        });

        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .student(student)
                .status(QuizAttemptStatus.IN_PROGRESS)
                .attemptNumber(finalAttemptNumber)
                .build();

        attempt = quizAttemptRepository.save(attempt);
        return mapToAttemptDTO(attempt);
    }

    @Override
    @Transactional
    public QuizAttemptDTO submitQuiz(Integer attemptId, SubmitQuizDTO submitQuizDTO) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        if (attempt.getStatus() != QuizAttemptStatus.IN_PROGRESS) {
            throw new RuntimeException("Attempt is not in progress");
        }

        if (attempt.isExpired()) {
            throw new RuntimeException("Quiz time has expired");
        }
        for (AnswerSubmissionDTO answerDTO : submitQuizDTO.getAnswers()) {
            QuizQuestion question = quizQuestionRepository.findById(answerDTO.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            QuizAnswer answer = QuizAnswer.builder()
                    .attempt(attempt)
                    .question(question)
                    .selectedOptions(answerDTO.getSelectedOptions())
                    .answerText(answerDTO.getAnswerText())
                    .githubUrl(answerDTO.getGithubUrl())
                    .build();

            quizAnswerRepository.save(answer);
        }

        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setStatus(QuizAttemptStatus.SUBMITTED);
        attempt = quizAttemptRepository.save(attempt);
        return gradeAttempt(attemptId);
    }

    @Override
    @Transactional
    public QuizAttemptDTO gradeAttempt(Integer attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findByIdWithAnswers(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        double totalScore = 0.0;
        int correctCount = 0;

        for (QuizAnswer answer : attempt.getAnswers()) {
            boolean isCorrect = checkAnswer(answer);
            answer.setIsCorrect(isCorrect);

            if (isCorrect) {
                correctCount++;
                totalScore += answer.getQuestion().getPoints();
            }

            quizAnswerRepository.save(answer);
        }

        attempt.setScore(totalScore);
        attempt.setStatus(QuizAttemptStatus.GRADED);
        attempt = quizAttemptRepository.save(attempt);

        Integer studentId = attempt.getStudent().getId();
        Integer classId = attempt.getQuiz().getClassEntity().getClassId();
        Integer courseId = attempt.getQuiz().getCourse().getCourseId();

        eventPublisher.publishEvent(new GradeUpdatedEvent(this, studentId, classId, courseId));

        return mapToAttemptDTO(attempt);
    }

    private boolean checkAnswer(QuizAnswer answer) {
        String correctAnswer = answer.getQuestion().getCorrectAnswer();
        String userAnswer = answer.getSelectedOptions() != null ?
                answer.getSelectedOptions() : answer.getAnswerText();

        if (correctAnswer == null || userAnswer == null) {
            return false;
        }

        return correctAnswer.trim().equalsIgnoreCase(userAnswer.trim());
    }

    @Override
    public QuizAttemptDTO getAttemptById(Integer attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findByIdWithAnswers(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));
        return mapToAttemptDTO(attempt);
    }

    @Override
    public List<QuizAttemptDTO> getStudentAttempts(Integer studentId) {
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudent_Id(studentId);
        return attempts.stream()
                .map(this::mapToAttemptDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<QuizAttemptDTO> getQuizAttempts(Integer quizId) {
        List<QuizAttempt> attempts = quizAttemptRepository.findByQuiz_QuizId(quizId);
        return attempts.stream()
                .map(this::mapToAttemptDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Long countQuizzesByClass(Integer classId) {
        return quizRepository.countByClassEntity_ClassId(classId);
    }

    @Override
    public Long countAttemptsByQuiz(Integer quizId) {
        return quizAttemptRepository.countByQuiz_QuizId(quizId);
    }

    private QuizDTO mapToDTO(Quiz quiz) {
        List<QuizQuestion> questions = quizQuestionRepository.findByQuiz_QuizId(quiz.getQuizId());

        return QuizDTO.builder()
                .quizId(quiz.getQuizId())
                .classId(quiz.getClassEntity().getClassId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .totalMarks(quiz.getTotalMarks())
                .durationMinutes(quiz.getDurationMinutes())
                .startTime(quiz.getStartTime())
                .endTime(quiz.getEndTime())
                .isPublished(quiz.getIsPublished())
                .questions(questions.stream()
                        .map(this::mapQuestionToDTO)
                        .collect(Collectors.toList()))
                .totalAttempts(quizAttemptRepository.countByQuiz_QuizId(quiz.getQuizId()))
                .submittedAttempts(quizAttemptRepository.countByQuiz_QuizIdAndStatus(
                        quiz.getQuizId(), QuizAttemptStatus.SUBMITTED))
                .build();
    }

    private QuizQuestionDTO mapQuestionToDTO(QuizQuestion question) {
        return QuizQuestionDTO.builder()
                .questionId(question.getQuestionId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .points(question.getPoints())
                .choices(question.getChoices())
                .correctAnswer(question.getCorrectAnswer())
                .build();
    }

    private QuizAttemptDTO mapToAttemptDTO(QuizAttempt attempt) {
        List<QuizAnswer> answers = quizAnswerRepository.findByAttempt_AttemptId(attempt.getAttemptId());

        long correctCount = answers.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .count();

        return QuizAttemptDTO.builder()
                .attemptId(attempt.getAttemptId())
                .quizId(attempt.getQuiz().getQuizId())
                .quizTitle(attempt.getQuiz().getTitle())
                .studentId(attempt.getStudent().getId())
                .studentName(attempt.getStudent().getFirstName() + " " + attempt.getStudent().getLastName())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .score(attempt.getScore())
                .status(attempt.getStatus())
                .attemptNumber(attempt.getAttemptNumber()) // Include attempt number in DTO
                .answers(answers.stream()
                        .map(this::mapAnswerToDTO)
                        .collect(Collectors.toList()))
                .correctCount((int) correctCount)
                .totalQuestions(answers.size())
                .build();
    }

    private QuizAnswerDTO mapAnswerToDTO(QuizAnswer answer) {
        return QuizAnswerDTO.builder()
                .answerId(answer.getAnswerId())
                .questionId(answer.getQuestion().getQuestionId())
                .questionText(answer.getQuestion().getQuestionText())
                .selectedOptions(answer.getSelectedOptions())
                .answerText(answer.getAnswerText())
                .githubUrl(answer.getGithubUrl())
                .isCorrect(answer.getIsCorrect())
                .answeredAt(answer.getAnsweredAt())
                .correctAnswer(answer.getQuestion().getCorrectAnswer())
                .build();
    }

    @Override
    public List<QuizQuestionDTO> getQuizQuestions(Integer quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + quizId));

        return quiz.getQuestions().stream()
                .map(this::mapQuestionToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public QuizQuestionDTO addQuestionFromBank(Integer quizId, AddQuestionFromBankDTO dto) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + quizId));

        QuestionBank questionBank = questionBankRepository.findById(dto.getQuestionBankId())
                .orElseThrow(() -> new RuntimeException("Question not found in bank with id: " + dto.getQuestionBankId()));

        boolean exists = quiz.getQuestions().stream()
                .anyMatch(q -> q.getQuestionText().equals(questionBank.getQuestionText()));

        if (exists) {
            throw new RuntimeException("Question already exists in this quiz");
        }

        QuizQuestion quizQuestion = QuizQuestion.builder()
                .quiz(quiz)
                .questionText(questionBank.getQuestionText())
                .questionType(questionBank.getQuestionType())
                .points(dto.getPoints().doubleValue())
                .choices(questionBank.getChoices())
                .correctAnswer(questionBank.getCorrectAnswer())
                .build();

        quizQuestion = quizQuestionRepository.save(quizQuestion);
        return mapQuestionToDTO(quizQuestion);
    }

    @Override
    @Transactional
    public QuizQuestionDTO createCustomQuestion(Integer quizId, QuizQuestionDTO dto) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + quizId));

        QuizQuestion quizQuestion = QuizQuestion.builder()
                .quiz(quiz)
                .questionText(dto.getQuestionText())
                .questionType(dto.getQuestionType())
                .points(dto.getPoints() != null ? dto.getPoints() : 1.0)
                .choices(dto.getChoices())
                .correctAnswer(dto.getCorrectAnswer())
                .build();

        quizQuestion = quizQuestionRepository.save(quizQuestion);

        // **** SỬA LỖI Ở DÒNG DƯỚI ĐÂY ****
        return mapQuestionToDTO(quizQuestion);
    }

    @Override
    @Transactional
    public QuizQuestionDTO updateQuizQuestion(Integer quizId, Integer questionId, QuizQuestionDTO dto) {
        QuizQuestion question = quizQuestionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found with id: " + questionId));

        if (!question.getQuiz().getQuizId().equals(quizId)) {
            throw new RuntimeException("Question does not belong to this quiz");
        }

        question.setQuestionText(dto.getQuestionText());
        question.setQuestionType(dto.getQuestionType());
        question.setPoints(dto.getPoints() != null ? dto.getPoints() : question.getPoints());
        question.setChoices(dto.getChoices());
        question.setCorrectAnswer(dto.getCorrectAnswer());

        question = quizQuestionRepository.save(question);
        return mapQuestionToDTO(question);
    }

    @Override
    @Transactional
    public void deleteQuizQuestion(Integer quizId, Integer questionId) {
        QuizQuestion question = quizQuestionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found with id: " + questionId));

        if (!question.getQuiz().getQuizId().equals(quizId)) {
            throw new RuntimeException("Question does not belong to this quiz");
        }

        quizQuestionRepository.delete(question);
    }

    @Override
    @Transactional
    public List<QuizQuestionDTO> batchAddQuestionsFromBank(Integer quizId, BatchAddQuestionsDTO dto) {
        List<QuizQuestionDTO> addedQuestions = new ArrayList<>();

        for (AddQuestionFromBankDTO questionDto : dto.getQuestions()) {
            try {
                QuizQuestionDTO added = addQuestionFromBank(quizId, questionDto);
                addedQuestions.add(added);
            } catch (RuntimeException e) {
                continue;
            }
        }

        return addedQuestions;
    }

    @Override
    @Transactional
    public QuizQuestionDTO updateQuestionPoints(Integer quizId, Integer questionId, UpdateQuestionPointsDTO dto) {
        QuizQuestion question = quizQuestionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found with id: " + questionId));

        if (!question.getQuiz().getQuizId().equals(quizId)) {
            throw new RuntimeException("Question does not belong to this quiz");
        }

        question.setPoints(dto.getPoints().doubleValue());
        question = quizQuestionRepository.save(question);

        return mapQuestionToDTO(question);
    }
    
    @Override
    public QuizAttemptDTO getLatestAttempt(Integer quizId, Integer studentId, Integer attemptNumber) {
        Integer finalAttemptNumber = attemptNumber != null ? attemptNumber : 1;
        return quizAttemptRepository
                .findTopByQuiz_QuizIdAndStudent_IdAndAttemptNumberOrderByStartedAtDesc(
                        quizId,
                        studentId,
                        finalAttemptNumber
                )
                .map(this::mapToAttemptDTO)
                .orElse(null);
    }

}