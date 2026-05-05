package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.model.Notification;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.repository.NotificationRepository;
import com.ra.base_spring_boot.repository.UserRepository;
import com.ra.base_spring_boot.services.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Notification Service Tests")
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User testUser;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .build();

        testNotification = Notification.builder()
                .notificationId(1)
                .user(testUser)
                .title("Test Notification")
                .message("This is a test notification")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should create notification successfully")
    void createNotification_ShouldCreateNotification_WhenValidData() {
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        Notification result = notificationService.createNotification(1, "Test Title", "Test Message");

        assertNotNull(result);
        verify(userRepository).findById(1);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("Should send notification to user via WebSocket")
    void sendNotificationToUser_ShouldSendNotification_WhenValidData() {
        doNothing().when(messagingTemplate).convertAndSendToUser(anyString(), anyString(), any());

        notificationService.sendNotificationToUser(1, testNotification);

        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/notifications"), any());
    }
}