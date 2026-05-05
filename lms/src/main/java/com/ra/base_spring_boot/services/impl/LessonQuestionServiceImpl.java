package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.AddQuestionsToLessonDTO;
import com.ra.base_spring_boot.dto.LessonQuestionDTO;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.model.Lesson;
import com.ra.base_spring_boot.model.LessonQuestion;
import com.ra.base_spring_boot.model.QuestionBank;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.repository.IUserRepository;
import com.ra.base_spring_boot.repository.LessonQuizAttemptRepository;
import com.ra.base_spring_boot.repository.LessonQuizAnswerRepository;
import com.ra.base_spring_boot.repository.LessonQuestionRepository;
import com.ra.base_spring_boot.repository.LessonRepository;
import com.ra.base_spring_boot.repository.QuestionBankRepository;
import com.ra.base_spring_boot.services.CourseGradeService;
import com.ra.base_spring_boot.services.ILessonQuestionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Set;
import java.util.HashSet;
import java.util.Objects;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.ra.base_spring_boot.dto.AnswerSubmissionDTO;
import com.ra.base_spring_boot.dto.AnswerSubmissionItemDTO;
import com.ra.base_spring_boot.dto.AnswerResultDTO;
import com.ra.base_spring_boot.dto.AnswerResultItemDTO;
import com.ra.base_spring_boot.model.constants.QuestionStatus;

@Service
@RequiredArgsConstructor
public class LessonQuestionServiceImpl implements ILessonQuestionService {

    private final LessonQuestionRepository lessonQuestionRepository;
    private final LessonRepository lessonRepository;
    private final QuestionBankRepository questionBankRepository;
    private final IUserRepository userRepository;
    private final LessonQuizAttemptRepository lessonQuizAttemptRepository;
    private final LessonQuizAnswerRepository lessonQuizAnswerRepository;
    private final CourseGradeService courseGradeService;

    @Override
    public List<LessonQuestion> getQuestionsByLesson(Integer lessonId) {
        return lessonQuestionRepository.findByLessonLessonIdOrderByOrderIndex(lessonId);
    }

    @Override
    public List<LessonQuestion> getQuestionsFromBank(Integer lessonId, Integer count, boolean shuffle) {
        List<QuestionBank> pool = questionBankRepository.findAll()
                .stream()
                .filter(q -> q.getStatus() == QuestionStatus.ACTIVE)
                .collect(Collectors.toList());
        if (shuffle) {
            Collections.shuffle(pool);
        }
        List<QuestionBank> selected;
        if (count != null && count > 0 && count < pool.size()) {
            selected = pool.subList(0, count);
        } else {
            selected = pool;
        }
        List<LessonQuestion> result = new ArrayList<>();
        for (QuestionBank qb : selected) {
            LessonQuestion lq = LessonQuestion.builder()
                    .question(qb)
                    .orderIndex(0)
                    .isRequired(true)
                    .build();
            result.add(lq);
        }
        return result;
    }

    @Override
    @Transactional
    public LessonQuestion addQuestionToLesson(LessonQuestionDTO lessonQuestionDTO) {
        Lesson lesson = lessonRepository.findById(lessonQuestionDTO.getLessonId())
                .orElseThrow(() -> new RuntimeException("Lesson not found"));
        QuestionBank questionBank = questionBankRepository.findById(lessonQuestionDTO.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Question not found"));
        User addedBy = userRepository.findById(lessonQuestionDTO.getAddedBy())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (lessonQuestionRepository.existsByLessonLessonIdAndQuestionQuestionId(
                lessonQuestionDTO.getLessonId(), lessonQuestionDTO.getQuestionId())) {
            throw new RuntimeException("Question already exists in this lesson");
        }

        Integer orderIndex = lessonQuestionDTO.getOrderIndex();
        if (orderIndex == null) {
            Integer maxOrder = lessonQuestionRepository.findMaxOrderIndexByLessonId(lessonQuestionDTO.getLessonId());
            orderIndex = maxOrder != null ? maxOrder + 1 : 0;
        }
        LessonQuestion lessonQuestion = LessonQuestion.builder()
                .lesson(lesson)
                .question(questionBank)
                .orderIndex(orderIndex)
                .isRequired(lessonQuestionDTO.getIsRequired())
                .addedBy(addedBy)
                .build();
        return lessonQuestionRepository.save(lessonQuestion);
    }

    @Override
    @Transactional
    public void addMultipleQuestionsToLesson(AddQuestionsToLessonDTO addQuestionsToLessonDTO) {
        Lesson lesson = lessonRepository.findById(addQuestionsToLessonDTO.getLessonId())
                .orElseThrow(() -> new HttpNotFound("Lession not found"));

        User addedBy = userRepository.findById(addQuestionsToLessonDTO.getAddedBy())
                .orElseThrow(() -> new HttpNotFound("User not found"));

        List<QuestionBank> questions = questionBankRepository.findAllById(addQuestionsToLessonDTO.getQuestionIds());

        Integer currentMaxOrder = lessonQuestionRepository.findMaxOrderIndexByLessonId(addQuestionsToLessonDTO.getLessonId());
        int orderIndex = currentMaxOrder != null ? currentMaxOrder + 1 : 0;
        for (QuestionBank questionBank : questions) {
            if(!lessonQuestionRepository.existsByLessonLessonIdAndQuestionQuestionId(
                    addQuestionsToLessonDTO.getLessonId(), questionBank.getQuestionId())) {
                LessonQuestion lessonQuestion = LessonQuestion.builder()
                        .lesson(lesson)
                        .question(questionBank)
                        .orderIndex(orderIndex++)
                        .isRequired(true)
                        .addedBy(addedBy)
                        .build();
                lessonQuestionRepository.save(lessonQuestion);
            }
        }
    }

    @Override
    @Transactional
    public void removeQuestionFromLesson(Integer lessonId, Integer questionId) {
        LessonQuestion lessonQuestion = lessonQuestionRepository
                .findByLessonIdAndQuestionId(lessonId, questionId)
                .orElseThrow(() -> new HttpNotFound("Question not found in this lesson"));

        Integer lessonQuestionId = lessonQuestion.getLessonQuestionId();

        // 1️⃣ Xoá hết câu trả lời liên quan tới LessonQuestion này
        lessonQuizAnswerRepository.deleteByLessonQuestionLessonQuestionId(lessonQuestionId);

        // 2️⃣ Sau đó mới xoá LessonQuestion
        lessonQuestionRepository.delete(lessonQuestion);
    }


    @Override
    @Transactional
    public void updateQuestionOrder(Integer lessonQuestionId, Integer newOrder) {
        LessonQuestion lessonQuestion = lessonQuestionRepository.findById(lessonQuestionId)
                .orElseThrow(() -> new HttpNotFound("Lession question not found"));
        lessonQuestion.setOrderIndex(newOrder);
        lessonQuestionRepository.save(lessonQuestion);
    }

    @Override
    public long countQuestionsInLesson(Integer lessonId) {
        return lessonQuestionRepository.countByLessonLessonId(lessonId);
    }

    @Override
    public AnswerResultDTO calculateScoreForSubmission(AnswerSubmissionDTO submissionDTO) {
        double total = 0.0;
        double max = 0.0;
        List<AnswerResultItemDTO> details = new ArrayList<>();
        ObjectMapper mapper = new ObjectMapper();
        if (submissionDTO == null || submissionDTO.getAnswers() == null) {
            return new AnswerResultDTO(0.0, 0.0, details);
        }
        for (AnswerSubmissionItemDTO item : submissionDTO.getAnswers()) {
            Integer qId = item.getQuestionId();
            com.ra.base_spring_boot.model.QuestionBank qb = questionBankRepository.findById(qId).orElse(null);
            if (qb == null) {
                details.add(new AnswerResultItemDTO(qId, false, 0.0, 0.0));
                continue;
            }
            double points = qb.getPoints() != null ? qb.getPoints() : 1.0;
            max += points;
            boolean correct = false;
            String stored = qb.getCorrectAnswer();
            String given = item.getAnswer() == null ? "" : item.getAnswer().trim();
            try {
                if (stored != null && stored.trim().startsWith("[")) {
                    Set<String> storedSet = new HashSet<>();
                    JsonNode storedNode = mapper.readTree(stored);
                    if (storedNode.isArray()) {
                        for (JsonNode n : storedNode) {
                            storedSet.add(n.asText().trim().toLowerCase());
                        }
                    }
                    Set<String> givenSet = new HashSet<>();
                    if (given.startsWith("[")) {
                        JsonNode givenNode = mapper.readTree(given);
                        if (givenNode.isArray()) {
                            for (JsonNode n : givenNode) {
                                givenSet.add(n.asText().trim().toLowerCase());
                            }
                        }
                    } else {
                        String[] parts = given.split(",");
                        for (String p : parts) {
                            if (!p.trim().isEmpty()) givenSet.add(p.trim().toLowerCase());
                        }
                    }
                    correct = storedSet.equals(givenSet);
                } else {
                    String normStored = stored == null ? "" : stored.trim();
                    String normGiven = given.trim();
                    if (normStored.startsWith("\"") && normStored.endsWith("\"")) {
                        normStored = normStored.substring(1, normStored.length()-1);
                    }
                    correct = normStored.equalsIgnoreCase(normGiven);
                }
            } catch (Exception ex) {
                correct = false;
            }
            double earned = correct ? points : 0.0;
            if (correct) total += earned;
            details.add(new AnswerResultItemDTO(qId, correct, earned, points));
        }
        return new AnswerResultDTO(total, max, details);
    }

    @Override
    public com.ra.base_spring_boot.dto.lesson.LessonQuizAttemptDTO submitAndSaveFromBank(AnswerSubmissionDTO submissionDTO, Integer studentId) {
        if (submissionDTO == null || submissionDTO.getLessonId() == null) {
            throw new RuntimeException("Invalid submission");
        }

        Integer lessonId = submissionDTO.getLessonId();
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        Integer submitBy = studentId != null ? studentId : submissionDTO.getSubmittedBy();
        if (submitBy == null) {
            throw new RuntimeException("SubmittedBy (student id) is required");
        }
        User student = userRepository.findById(submitBy)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<AnswerSubmissionItemDTO> items = submissionDTO.getAnswers();
        int totalQuestions = items != null ? items.size() : 0;

        com.ra.base_spring_boot.model.LessonQuizAttempt attempt = com.ra.base_spring_boot.model.LessonQuizAttempt.builder()
                .lesson(lesson)
                .student(student)
                .totalQuestions(totalQuestions)
                .status(com.ra.base_spring_boot.model.constants.LessonQuizAttemptStatus.IN_PROGRESS)
                .attemptNumber(submissionDTO.getAttemptNumber() != null ? submissionDTO.getAttemptNumber() : 1)
                .build();

        attempt = lessonQuizAttemptRepository.save(attempt);

        Integer currentMaxOrder = lessonQuestionRepository.findMaxOrderIndexByLessonId(lessonId);
        int orderIndex = currentMaxOrder != null ? currentMaxOrder + 1 : 0;
        ObjectMapper mapper = new ObjectMapper();

        for (AnswerSubmissionItemDTO item : items) {
            Integer qId = item.getQuestionId();
            if (qId == null) continue;

            com.ra.base_spring_boot.model.QuestionBank qb = questionBankRepository.findById(qId).orElse(null);
            if (qb == null) continue;

            java.util.Optional<LessonQuestion> existingLq = lessonQuestionRepository
                    .findByLessonIdAndQuestionId(lessonId, qId);
            LessonQuestion lessonQuestion;
            if (existingLq.isPresent()) {
                lessonQuestion = existingLq.get();
            } else {
                LessonQuestion lq = LessonQuestion.builder()
                        .lesson(lesson)
                        .question(qb)
                        .orderIndex(orderIndex)
                        .isRequired(true)
                        .addedBy(student)
                        .build();
                lessonQuestion = lessonQuestionRepository.save(lq);
                orderIndex++;
            }

            com.ra.base_spring_boot.model.LessonQuizAnswer answer = com.ra.base_spring_boot.model.LessonQuizAnswer.builder()
                    .attempt(attempt)
                    .lessonQuestion(lessonQuestion)
                    .selectedOptions(null)
                    .answerText(null)
                    .build();

            String given = item.getAnswer() == null ? "" : item.getAnswer().trim();
            com.ra.base_spring_boot.model.constants.QuestionType type = qb.getQuestionType();
            if (type == com.ra.base_spring_boot.model.constants.QuestionType.MCQ
                    || type == com.ra.base_spring_boot.model.constants.QuestionType.MULTI
                    || type == com.ra.base_spring_boot.model.constants.QuestionType.TRUE_FALSE) {
                answer.setSelectedOptions(given);
            } else {
                answer.setAnswerText(given);
            }

            lessonQuizAnswerRepository.save(answer);
        }

        List<com.ra.base_spring_boot.model.LessonQuizAnswer> savedAnswers =
                lessonQuizAnswerRepository.findByAttemptAttemptIdOrderByLessonQuestionOrderIndex(attempt.getAttemptId());

        int correctCount = 0;
        double totalScore = 0.0;
        double pointsPerQuestion = (totalQuestions > 0) ? (100.0 / totalQuestions) : 0.0;

        for (com.ra.base_spring_boot.model.LessonQuizAnswer ans : savedAnswers) {
            boolean isCorrect = false;
            com.ra.base_spring_boot.model.QuestionBank question = ans.getLessonQuestion().getQuestion();
            com.ra.base_spring_boot.model.constants.QuestionType qType = question.getQuestionType();

            try {
                if (qType == com.ra.base_spring_boot.model.constants.QuestionType.MCQ
                        || qType == com.ra.base_spring_boot.model.constants.QuestionType.MULTI
                        || qType == com.ra.base_spring_boot.model.constants.QuestionType.TRUE_FALSE) {

                    String studentAnsJson = ans.getSelectedOptions();
                    if (studentAnsJson != null) {
                        List<Integer> studentIndices = mapper.readValue(studentAnsJson, new com.fasterxml.jackson.core.type.TypeReference<List<Integer>>(){});
                        Collections.sort(studentIndices);

                        String choicesJson = question.getChoices();
                        String correctAnsJson = question.getCorrectAnswer();

                        if (choicesJson != null && correctAnsJson != null) {
                            List<String> choicesList = mapper.readValue(choicesJson, new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){});
                            List<String> correctTextList = mapper.readValue(correctAnsJson, new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){});
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
                            isCorrect = studentIndices.equals(correctIndices);
                        }
                    }

                } else if (qType == com.ra.base_spring_boot.model.constants.QuestionType.SHORT_ANSWER) {
                    String correct = question.getCorrectAnswer();
                    String studentText = ans.getAnswerText();
                    if (correct != null && studentText != null) {
                        try {
                            List<String> correctAnswers = mapper.readValue(correct, new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){});
                            String normalized = studentText.trim().toLowerCase();
                            for (String ca : correctAnswers) {
                                if (ca != null && ca.trim().toLowerCase().equals(normalized)) {
                                    isCorrect = true; break;
                                }
                            }
                        } catch (Exception ex) {
                            isCorrect = correct.trim().equalsIgnoreCase(studentText.trim());
                        }
                    }
                }
            } catch (Exception ex) {
                isCorrect = false;
            }

            double earned = isCorrect ? pointsPerQuestion : 0.0;
            if (isCorrect) {
                correctCount++;
                totalScore += earned;
            }
            ans.setIsCorrect(isCorrect);
            ans.setPointsEarned(earned);
            lessonQuizAnswerRepository.save(ans);
        }

        attempt.setCorrectAnswers(correctCount);
        attempt.setScore(totalScore);
        attempt.setSubmittedAt(java.time.LocalDateTime.now());
        attempt.setStatus(com.ra.base_spring_boot.model.constants.LessonQuizAttemptStatus.GRADED);
        long seconds = java.time.temporal.ChronoUnit.SECONDS.between(attempt.getStartedAt() != null ? attempt.getStartedAt() : attempt.getSubmittedAt(), attempt.getSubmittedAt());
        attempt.setTimeSpentSeconds((int) Math.max(0, seconds));
        attempt = lessonQuizAttemptRepository.save(attempt);

        // Trigger grade calculation
        if (lesson.getCourse() != null) {
            courseGradeService.triggerGradeCalculation(student.getId(), lesson.getCourse().getCourseId());
        }

        com.ra.base_spring_boot.dto.lesson.LessonQuizAttemptDTO dto = com.ra.base_spring_boot.dto.lesson.LessonQuizAttemptDTO.builder()
                .attemptId(attempt.getAttemptId())
                .lessonId(lesson.getLessonId())
                .lessonTitle(lesson.getTitle())
                .studentId(student.getId())
                .studentName(student.getFirstName() + " " + student.getLastName())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .score(attempt.getScore())
                .totalQuestions(attempt.getTotalQuestions())
                .correctAnswers(attempt.getCorrectAnswers())
                .status(attempt.getStatus())
                .timeSpentSeconds(attempt.getTimeSpentSeconds())
                .attemptNumber(attempt.getAttemptNumber())
                .build();

        return dto;
    }

    @Override
    public List<com.ra.base_spring_boot.dto.lesson.LessonQuizAttemptDTO> getAttempts(Integer lessonId, Integer studentId, Integer attemptNumber) {
        Integer finalAttemptNumber = attemptNumber != null ? attemptNumber : 1;
        List<com.ra.base_spring_boot.model.LessonQuizAttempt> attempts = lessonQuizAttemptRepository
                .findByLesson_LessonIdAndStudent_IdAndAttemptNumberOrderBySubmittedAtDesc(lessonId, studentId, finalAttemptNumber);

        return attempts.stream().map(attempt ->
                com.ra.base_spring_boot.dto.lesson.LessonQuizAttemptDTO.builder()
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
                        .attemptNumber(attempt.getAttemptNumber())
                        .build()
        ).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateQuestion(com.ra.base_spring_boot.dto.QuestionUpdateDTO questionUpdateDTO) {
        QuestionBank questionBank = questionBankRepository.findById(questionUpdateDTO.getQuestionId())
                .orElseThrow(() -> new HttpNotFound("Question not found"));

        questionBank.setQuestionText(questionUpdateDTO.getQuestionText());
        questionBank.setQuestionType(questionUpdateDTO.getQuestionType());
        questionBank.setDifficulty(questionUpdateDTO.getDifficulty());
        questionBank.setPoints(questionUpdateDTO.getPoints());
        questionBank.setChoices(questionUpdateDTO.getChoices());
        questionBank.setCorrectAnswer(questionUpdateDTO.getCorrectAnswer());
        questionBank.setExplanation(questionUpdateDTO.getExplanation());
        questionBank.setStatus(questionUpdateDTO.getStatus());

        questionBankRepository.save(questionBank);
    }

    @Override
    @Transactional
    public void updateLessonQuestionDetails(Integer lessonQuestionId, Boolean isRequired) {
        LessonQuestion lessonQuestion = lessonQuestionRepository.findById(lessonQuestionId)
                .orElseThrow(() -> new HttpNotFound("Lesson question not found"));
        lessonQuestion.setIsRequired(isRequired);
        lessonQuestionRepository.save(lessonQuestion);
    }

}