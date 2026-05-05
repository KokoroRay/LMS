package com.ra.base_spring_boot.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ra.base_spring_boot.dto.quiz.*;
import com.ra.base_spring_boot.model.*;
import com.ra.base_spring_boot.repository.*;
import com.ra.base_spring_boot.services.impl.QuizServiceImpl;
import org.springframework.context.ApplicationEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Quiz Service Tests")
class QuizServiceTest {

    @Mock private QuizRepository quizRepository;
    @Mock private QuizQuestionRepository quizQuestionRepository;
    @Mock private QuizAttemptRepository quizAttemptRepository;
    @Mock private QuizAnswerRepository quizAnswerRepository;
    @Mock private ClassRepository classRepository;
    @Mock private UserRepository userRepository;
    @Mock private QuestionBankRepository questionBankRepository;
    @Mock private ObjectMapper objectMapper;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private QuizServiceImpl quizService;

    private Quiz testQuiz;
    private QuizDTO testQuizDTO;
    private User testStudent;
    private ClassEntity testClass;
    private QuizQuestion testQuizQuestion;

    @BeforeEach
    void setUp() {
        testClass = ClassEntity.builder()
                .classId(1)
                .className("Java Class")
                .build();

        testStudent = User.builder()
                .username("student1")
                .email("student1@example.com")
                .build();

        testQuiz = Quiz.builder()
                .quizId(1)
                .title("Java Quiz")
                .description("Basic Java quiz")
                .classEntity(testClass)
                .build();

        testQuizQuestion = QuizQuestion.builder()
                .questionId(1)
                .quiz(testQuiz)
                .questionText("What is Java?")
                .points(10.0)
                .build();

        testQuizDTO = QuizDTO.builder()
                .quizId(1)
                .title("Java Quiz")
                .description("Basic Java quiz")
                .classId(1)
                .build();
    }

    @Test
    @DisplayName("Should create quiz successfully")
    void createQuiz_ShouldCreateQuiz_WhenValidData() {
        when(classRepository.findById(1)).thenReturn(Optional.of(testClass));
        when(quizRepository.save(any(Quiz.class))).thenReturn(testQuiz);
        when(quizQuestionRepository.findByQuiz_QuizId(1)).thenReturn(Collections.emptyList());
        when(quizAttemptRepository.countByQuiz_QuizId(1)).thenReturn(0L);
        when(quizAttemptRepository.countByQuiz_QuizIdAndStatus(eq(1), any())).thenReturn(0L);

        QuizDTO result = quizService.createQuiz(testQuizDTO);

        assertNotNull(result);
        assertEquals("Java Quiz", result.getTitle());
        verify(quizRepository).save(any(Quiz.class));
    }

    @Test
    @DisplayName("Should return quiz questions")
    void getQuizQuestions_ShouldReturnQuestions_WhenQuestionsExist() {
        testQuiz.setQuestions(Arrays.asList(testQuizQuestion));
        when(quizRepository.findById(1)).thenReturn(Optional.of(testQuiz));

        List<QuizQuestionDTO> result = quizService.getQuizQuestions(1);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("What is Java?", result.get(0).getQuestionText());
        verify(quizRepository).findById(1);
    }
}