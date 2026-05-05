package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Role;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.model.constants.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@DisplayName("User Repository Tests")
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private IUserRepository userRepository;

    private User testUser;
    private Role testRole;

    @BeforeEach
    void setUp() {
        testRole = Role.builder()
                .roleName(RoleName.ROLE_USER)
                .description("Student role")
                .build();
        entityManager.persistAndFlush(testRole);

        testUser = User.builder()
                .username("testuser")
                .email("test@example.com")
                .passwordHash("hashedPassword")
                .firstName("Test")
                .lastName("User")
                .phone("1234567890")
                .role(testRole)
                .status(UserStatus.ACTIVE)
                .firstLogin(true)
                .build();
    }

    @Test
    @DisplayName("Should find user by email when exists")
    void findByEmail_ShouldReturnUser_WhenEmailExists() {
        entityManager.persistAndFlush(testUser);

        Optional<User> result = userRepository.findByEmail("test@example.com");

        assertTrue(result.isPresent());
        assertEquals("testuser", result.get().getUsername());
        assertEquals("test@example.com", result.get().getEmail());
    }

    @Test
    @DisplayName("Should return empty when email does not exist")
    void findByEmail_ShouldReturnEmpty_WhenEmailDoesNotExist() {
        Optional<User> result = userRepository.findByEmail("nonexistent@example.com");

        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("Should find user by username when exists")
    void findByUsername_ShouldReturnUser_WhenUsernameExists() {
        entityManager.persistAndFlush(testUser);

        Optional<User> result = userRepository.findByUsername("testuser");

        assertTrue(result.isPresent());
        assertEquals("testuser", result.get().getUsername());
        assertEquals("test@example.com", result.get().getEmail());
    }

    @Test
    @DisplayName("Should return true when email exists")
    void existsByEmail_ShouldReturnTrue_WhenEmailExists() {
        entityManager.persistAndFlush(testUser);

        boolean exists = userRepository.existsByEmail("test@example.com");

        assertTrue(exists);
    }

    @Test
    @DisplayName("Should return true when username exists")
    void existsByUsername_ShouldReturnTrue_WhenUsernameExists() {
        entityManager.persistAndFlush(testUser);

        boolean exists = userRepository.existsByUsername("testuser");

        assertTrue(exists);
    }

    @Test
    @DisplayName("Should find user by reset password token when exists")
    void findByResetPasswordToken_ShouldReturnUser_WhenTokenExists() {
        testUser.setResetPasswordToken("reset-token-123");
        entityManager.persistAndFlush(testUser);

        Optional<User> result = userRepository.findByResetPasswordToken("reset-token-123");

        assertTrue(result.isPresent());
        assertEquals("testuser", result.get().getUsername());
        assertEquals("reset-token-123", result.get().getResetPasswordToken());
    }

    @Test
    @DisplayName("Should find users by status")
    void findByStatus_ShouldReturnUsers_WhenStatusMatches() {
        User inactiveUser = User.builder()
                .username("inactiveuser")
                .email("inactive@example.com")
                .passwordHash("hashedPassword")
                .firstName("Inactive")
                .lastName("User")
                .role(testRole)
                .status(UserStatus.INACTIVE)
                .build();

        entityManager.persistAndFlush(testUser);
        entityManager.persistAndFlush(inactiveUser);

        List<User> activeUsers = userRepository.findByStatus(UserStatus.ACTIVE);
        List<User> inactiveUsers = userRepository.findByStatus(UserStatus.INACTIVE);

        assertEquals(1, activeUsers.size());
        assertEquals("testuser", activeUsers.get(0).getUsername());
        assertEquals(1, inactiveUsers.size());
        assertEquals("inactiveuser", inactiveUsers.get(0).getUsername());
    }
}