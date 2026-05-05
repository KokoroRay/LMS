package com.ra.base_spring_boot.services.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ra.base_spring_boot.dto.QuestionBankDTO;
import com.ra.base_spring_boot.dto.lesson.*;
import com.ra.base_spring_boot.exception.HttpBadRequest;
import com.ra.base_spring_boot.exception.HttpForbiden;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.model.constants.LessonQuizAttemptStatus;
import com.ra.base_spring_boot.model.constants.QuestionType;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.ILessonQuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LessonQuizServiceImpl implements ILessonQuizService {

    private final LessonRepository lessonRepository;
    private final LessonQuestionRepository lessonQuestionRepository;
    private final LessonQuizAttemptRepository lessonQuizAttemptRepository;
    private final LessonQuizAnswerRepository lessonQuizAnswerRepository;
    private final IUserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    public LessonWithQuizDTO getLessonWithQuiz(Integer lessonId, Integer studentId, boolean includeHistory) {
        log.info("Getting lesson {} with quiz for student {}", lessonId, studentId);

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new HttpNotFound("Lesson not found"));

        List<LessonQuestion> lessonQuestions = lessonQuestionRepository
                .findByLessonLessonIdOrderByOrderIndex(lessonId);

        List<QuestionBankDTO> questions = lessonQuestions.stream()
                .map(lq -> mapToQuestionDTO(lq.getQuestion(), false))
                .collect(Collectors.toList());

        double totalPoints = lessonQuestions.stream()
                .mapToDouble(lq -> lq.getQuestion().getPoints())
                .sum();

        LessonWithQuizDTO dto = LessonWithQuizDTO.builder()
                .lessonId(lesson.getLessonId())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .content(lesson.getContent())
                .videoUrl(lesson.getVideoUrl())
                .durationMinutes(lesson.getDurationMinutes())
                .hasQuiz(!lessonQuestions.isEmpty())
                .totalQuestions(lessonQuestions.size())
                .totalPoints(totalPoints)
                .questions(questions)
                .build();

        if (includeHistory && studentId != null) {
            List<LessonQuizAttemptDTO> attempts = getStudentAttemptHistory(lessonId, studentId);
            dto.setStudentAttempts(attempts);

            LessonQuizAttemptDTO bestAttempt = getBestAttempt(lessonId, studentId);
            dto.setBestAttempt(bestAttempt);
        }

        return dto;
    }

    @Override
    @Transactional
    public LessonQuizAttemptDTO startQuiz(Integer lessonId, Integer studentId) {
        log.info("Student {} starting quiz for lesson {}", studentId, lessonId);

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new HttpNotFound("Lesson not found"));

        List<LessonQuestion> lessonQuestions = lessonQuestionRepository.findByLessonLessonIdOrderByOrderIndex(lessonId);
        if (lessonQuestions.isEmpty()) {
            throw new HttpBadRequest("This lesson has no quiz questions");
        }

        double maxScore = lessonQuestions.stream()
                .mapToDouble(lq -> lq.getQuestion().getPoints())
                .sum();
        int questionCount = lessonQuestions.size();

        Optional<LessonQuizAttempt> ongoingAttempt = lessonQuizAttemptRepository
                .findByLessonLessonIdAndStudentIdAndStatus(
                        lessonId, studentId, LessonQuizAttemptStatus.IN_PROGRESS);

        if (ongoingAttempt.isPresent()) {
            throw new HttpBadRequest("You already have an ongoing attempt. Please complete it first.");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new HttpNotFound("Student not found"));

        LessonQuizAttempt attempt = LessonQuizAttempt.builder()
                .lesson(lesson)
                .student(student)
                .startedAt(LocalDateTime.now())
                .totalQuestions(questionCount)
                .status(LessonQuizAttemptStatus.IN_PROGRESS)
                .build();

        attempt = lessonQuizAttemptRepository.save(attempt);

        return mapToAttemptDTO(attempt, false);
    }

    @Override
    @Transactional
    public LessonQuizAnswerDTO saveAnswer(Integer attemptId, LessonQuizAnswerSubmissionDTO answerSubmission) {
        log.info("Saving answer for attempt {} - question {}", attemptId, answerSubmission.getLessonQuestionId());

        LessonQuizAttempt attempt = lessonQuizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new HttpNotFound("Attempt not found"));

        if (attempt.getStatus() != LessonQuizAttemptStatus.IN_PROGRESS) {
            throw new HttpBadRequest("Cannot save answer - quiz already submitted");
        }

        LessonQuestion lessonQuestion = lessonQuestionRepository.findById(answerSubmission.getLessonQuestionId())
                .orElseThrow(() -> new HttpNotFound("Question not found"));

        if (!lessonQuestion.getLesson().getLessonId().equals(attempt.getLesson().getLessonId())) {
            throw new HttpBadRequest("Question does not belong to this lesson");
        }

        Optional<LessonQuizAnswer> existingAnswer = lessonQuizAnswerRepository
                .findByAttemptAttemptIdAndLessonQuestionLessonQuestionId(
                        attemptId, answerSubmission.getLessonQuestionId());

        LessonQuizAnswer answer;
        if (existingAnswer.isPresent()) {
            answer = existingAnswer.get();
            answer.setSelectedOptions(answerSubmission.getSelectedOptions());
            answer.setAnswerText(answerSubmission.getAnswerText());
            answer.setAnsweredAt(LocalDateTime.now());
        } else {
            answer = LessonQuizAnswer.builder()
                    .attempt(attempt)
                    .lessonQuestion(lessonQuestion)
                    .selectedOptions(answerSubmission.getSelectedOptions())
                    .answerText(answerSubmission.getAnswerText())
                    .build();
        }

        answer = lessonQuizAnswerRepository.save(answer);

        return mapToAnswerDTO(answer, false);
    }

    @Override
    @Transactional
    public LessonQuizAttemptDTO submitQuiz(SubmitLessonQuizDTO submitDTO, Integer studentId) {
        log.info("Student {} submitting quiz attempt {}", studentId, submitDTO.getAttemptId());

        LessonQuizAttempt attempt = lessonQuizAttemptRepository.findById(submitDTO.getAttemptId())
                .orElseThrow(() -> new HttpNotFound("Attempt not found"));

        if (!attempt.getStudent().getId().equals(studentId)) {
            throw new HttpForbiden("You don't have permission to submit this quiz");
        }

        if (attempt.getStatus() != LessonQuizAttemptStatus.IN_PROGRESS) {
            throw new HttpBadRequest("Quiz already submitted");
        }

        for (LessonQuizAnswerSubmissionDTO answerSub : submitDTO.getAnswers()) {
            try {
                saveAnswer(submitDTO.getAttemptId(), answerSub);
            } catch (Exception e) {
                log.warn("Error saving answer for question {}: {}", answerSub.getLessonQuestionId(), e.getMessage());
            }
        }

        attempt = gradeAttempt(attempt);

        attempt.setSubmittedAt(LocalDateTime.now());
        long seconds = ChronoUnit.SECONDS.between(attempt.getStartedAt(), attempt.getSubmittedAt());
        attempt.setTimeSpentSeconds((int) seconds);
        attempt.setStatus(LessonQuizAttemptStatus.GRADED);

        attempt = lessonQuizAttemptRepository.save(attempt);

        return mapToAttemptDTO(attempt, true);
    }

    private LessonQuizAttempt gradeAttempt(LessonQuizAttempt attempt) {
        List<LessonQuizAnswer> answers = lessonQuizAnswerRepository
                .findByAttemptAttemptIdOrderByLessonQuestionOrderIndex(attempt.getAttemptId());

        int correctCount = 0;
        double totalScore = 0.0;
        int totalQuestions = attempt.getTotalQuestions() != null && attempt.getTotalQuestions() > 0 ?
                attempt.getTotalQuestions() : answers.size();
        double pointsPerQuestion = (totalQuestions > 0) ? (100.0 / totalQuestions) : 0.0;


        for (LessonQuizAnswer answer : answers) {
            boolean isCorrect = checkAnswer(answer);
            answer.setIsCorrect(isCorrect);

            if (isCorrect) {
                correctCount++;
                double points = pointsPerQuestion;
                answer.setPointsEarned(points);
                totalScore += points;
            } else {
                answer.setPointsEarned(0.0);
            }

            lessonQuizAnswerRepository.save(answer);
        }

        attempt.setCorrectAnswers(correctCount);
        attempt.setScore(totalScore);

        return attempt;
    }

    private boolean checkAnswer(LessonQuizAnswer answer) {
        QuestionBank question = answer.getLessonQuestion().getQuestion();
        QuestionType type = question.getQuestionType();

        try {
            if (type == QuestionType.MCQ || type == QuestionType.MULTI || type == QuestionType.TRUE_FALSE) {

                String studentAnsJson = answer.getSelectedOptions();
                if (studentAnsJson == null) {
                    return false;
                }

                List<Integer> studentIndices = objectMapper.readValue(studentAnsJson, new com.fasterxml.jackson.core.type.TypeReference<List<Integer>>(){});
                Collections.sort(studentIndices);

                String choicesJson = question.getChoices();
                if (choicesJson == null) {
                    return false;
                }
                List<String> choicesList = objectMapper.readValue(choicesJson, new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){});

                String correctAnsJson = question.getCorrectAnswer();
                if (correctAnsJson == null) {
                    return false;
                }
                List<String> correctTextList = objectMapper.readValue(correctAnsJson, new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){});
                Set<String> correctTextSet = correctTextList.stream()
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .collect(Collectors.toSet());

                List<Integer> correctIndices = new ArrayList<>();
                for (int i = 0; i < choicesList.size(); i++) {
                    if (choicesList.get(i) != null && correctTextSet.contains(choicesList.get(i).trim())) {
                        correctIndices.add(i);
                    }
                }
                Collections.sort(correctIndices);

                return studentIndices.equals(correctIndices);

            } else if (type == QuestionType.SHORT_ANSWER) {
                String correctAnswer = question.getCorrectAnswer();
                String studentAnswer = answer.getAnswerText();

                if (correctAnswer == null || studentAnswer == null) {
                    return false;
                }

                try {
                    List<String> correctAnswers = objectMapper.readValue(correctAnswer, List.class);
                    String normalized = studentAnswer.trim().toLowerCase();
                    return correctAnswers.stream()
                            .anyMatch(ca -> ca.trim().toLowerCase().equals(normalized));
                } catch (JsonProcessingException e) {
                    return correctAnswer.trim().equalsIgnoreCase(studentAnswer.trim());
                }

            } else {
                return false;
            }
        } catch (Exception e) {
            log.error("Error checking answer for question {}: {}", question.getQuestionId(), e.getMessage());
            return false;
        }
    }

    @Override
    public LessonQuizAttemptDTO getAttemptResult(Integer attemptId, Integer studentId, boolean includeAnswers) {
        LessonQuizAttempt attempt = lessonQuizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new HttpNotFound("Attempt not found"));

        if (!attempt.getStudent().getId().equals(studentId)) {
            throw new HttpForbiden("You don't have permission to view this attempt");
        }

        return mapToAttemptDTO(attempt, includeAnswers);
    }

    @Override
    public List<LessonQuizAttemptDTO> getStudentAttemptHistory(Integer lessonId, Integer studentId) {
        List<LessonQuizAttempt> attempts = lessonQuizAttemptRepository
                .findByLessonLessonIdAndStudentIdOrderByStartedAtDesc(lessonId, studentId);

        return attempts.stream()
                .map(a -> mapToAttemptDTO(a, false))
                .collect(Collectors.toList());
    }

    @Override
    public LessonQuizAttemptDTO getBestAttempt(Integer lessonId, Integer studentId) {
        Optional<LessonQuizAttempt> bestAttempt = lessonQuizAttemptRepository
                .findBestAttempt(lessonId, studentId);

        return bestAttempt.map(a -> mapToAttemptDTO(a, false)).orElse(null);
    }

    @Override
    public boolean hasOngoingAttempt(Integer lessonId, Integer studentId) {
        return lessonQuizAttemptRepository.findByLessonLessonIdAndStudentIdAndStatus(
                lessonId, studentId, LessonQuizAttemptStatus.IN_PROGRESS).isPresent();
    }

    @Override
    public LessonQuizAttemptDTO continueAttempt(Integer lessonId, Integer studentId) {
        LessonQuizAttempt attempt = lessonQuizAttemptRepository
                .findByLessonLessonIdAndStudentIdAndStatus(
                        lessonId, studentId, LessonQuizAttemptStatus.IN_PROGRESS)
                .orElseThrow(() -> new HttpNotFound("No ongoing attempt found"));

        return mapToAttemptDTO(attempt, false);
    }

    @Override
    public long countStudentsCompleted(Integer lessonId) {
        return lessonQuizAttemptRepository.countDistinctStudentsByLessonId(lessonId);
    }

    @Override
    @Transactional
    public LessonQuizAttemptDTO regradeAttempt(Integer attemptId) {
        LessonQuizAttempt attempt = lessonQuizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new HttpNotFound("Attempt not found"));

        attempt = gradeAttempt(attempt);
        attempt = lessonQuizAttemptRepository.save(attempt);

        return mapToAttemptDTO(attempt, true);
    }

    private QuestionBankDTO mapToQuestionDTO(QuestionBank question, boolean includeCorrectAnswer) {
        QuestionBankDTO dto = QuestionBankDTO.builder()
                .questionId(question.getQuestionId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .difficulty(question.getDifficulty())
                .points(question.getPoints())
                .choices(question.getChoices())
                .status(question.getStatus())
                .build();

        if (includeCorrectAnswer) {
            dto.setCorrectAnswer(question.getCorrectAnswer());
            dto.setExplanation(question.getExplanation());
        }

        return dto;
    }

    private LessonQuizAttemptDTO mapToAttemptDTO(LessonQuizAttempt attempt, boolean includeAnswers) {
        LessonQuizAttemptDTO dto = LessonQuizAttemptDTO.builder()
                .attemptId(attempt.getAttemptId())
                .lessonId(attempt.getLesson().getLessonId())
                .lessonTitle(attempt.getLesson().getTitle())
                .studentId(attempt.getStudent().getId())
                .studentName(attempt.getStudent().getFirstName() + " " + attempt.getStudent().getLastName())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .score(attempt.getScore())
                .totalQuestions(attempt.getTotalQuestions())
                .correctAnswers(attempt.getCorrectAnswers())
                .status(attempt.getStatus())
                .timeSpentSeconds(attempt.getTimeSpentSeconds())
                .build();

        if (attempt.getScore() != null) {
            dto.setPercentage(attempt.getScore());
            dto.setIsPassed(dto.getPercentage() >= 70);
        }

        if (includeAnswers) {
            List<LessonQuizAnswer> answers = lessonQuizAnswerRepository
                    .findByAttemptAttemptIdOrderByLessonQuestionOrderIndex(attempt.getAttemptId());
            dto.setAnswers(answers.stream()
                    .map(a -> mapToAnswerDTO(a, true))
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private LessonQuizAnswerDTO mapToAnswerDTO(LessonQuizAnswer answer, boolean includeCorrectAnswer) {
        QuestionBank question = answer.getLessonQuestion().getQuestion();

        LessonQuizAnswerDTO dto = LessonQuizAnswerDTO.builder()
                .answerId(answer.getAnswerId())
                .attemptId(answer.getAttempt().getAttemptId())
                .lessonQuestionId(answer.getLessonQuestion().getLessonQuestionId())
                .questionId(question.getQuestionId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType().name())
                .choices(question.getChoices())
                .selectedOptions(answer.getSelectedOptions())
                .answerText(answer.getAnswerText())
                .isCorrect(answer.getIsCorrect())
                .pointsEarned(answer.getPointsEarned())
                .maxPoints(question.getPoints())
                .answeredAt(answer.getAnsweredAt())
                .build();

        if (includeCorrectAnswer) {
            dto.setCorrectAnswer(question.getCorrectAnswer());
            dto.setExplanation(question.getExplanation());
        }

        return dto;
    }
}