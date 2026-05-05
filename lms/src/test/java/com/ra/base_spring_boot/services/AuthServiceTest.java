package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.ChangePasswordDTO;
import com.ra.base_spring_boot.dto.UserProfileDTO;
import com.ra.base_spring_boot.dto.req.FormLogin;
import com.ra.base_spring_boot.dto.req.FormRegisterDTO;
import com.ra.base_spring_boot.dto.req.ResetPasswordRequest;
import com.ra.base_spring_boot.dto.resp.JwtResponse;
import com.ra.base_spring_boot.dto.resp.UserDTO;
import com.ra.base_spring_boot.exception.HttpBadRequest;
import com.ra.base_spring_boot.exception.HttpUnAuthorized;
import com.ra.base_spring_boot.model.Role;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.UserProfile;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.model.constants.UserStatus;
import com.ra.base_spring_boot.repository.IRoleRepository;
import com.ra.base_spring_boot.repository.IUserRepository;
import com.ra.base_spring_boot.repository.RefreshTokenRepository;
import com.ra.base_spring_boot.security.jwt.JwtProvider;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.services.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Auth Service Tests")
class AuthServiceTest {

    @Mock
    private IUserRepository userRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @Mock
    private AuthenticationManager authenticationManager;
    
    @Mock
    private JwtProvider jwtProvider;
    
    @Mock
    private IRoleRepository roleRepository;
    
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    
    @Mock
    private IEmailService emailService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;
    private Role testRole;
    private FormRegisterDTO testRegisterDTO;
    private FormLogin testLoginForm;
    private MyUserDetails testUserDetails;

    @BeforeEach
    void setUp() {
        testRole = Role.builder()
                .roleName(RoleName.ROLE_USER)
                .build();

        testUser = User.builder()
                .username("testuser")
                .email("test@example.com")
                .passwordHash("encodedPassword")
                .firstName("Test")
                .lastName("User")
                .role(testRole)
                .status(UserStatus.ACTIVE)
                .firstLogin(true)
                .build();

        testRegisterDTO = FormRegisterDTO.builder()
                .username("newuser")
                .email("newuser@example.com")
                .firstName("New")
                .lastName("User")
                .build();

        testLoginForm = FormLogin.builder()
                .email("test@example.com")
                .password("password123")
                .build();

        testUserDetails = mock(MyUserDetails.class);
        when(testUserDetails.getUsername()).thenReturn("test@example.com");
        when(testUserDetails.getId()).thenReturn(1);
    }

    @Test
    @DisplayName("Should register user successfully")
    void register_ShouldRegisterUser_WhenValidData() {
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(roleRepository.findByRoleName(RoleName.ROLE_USER)).thenReturn(Optional.of(testRole));
        when(passwordEncoder.encode("123456")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        authService.register(testRegisterDTO);

        verify(userRepository).save(any(User.class));
        verify(passwordEncoder).encode("123456");
    }

    @Test
    @DisplayName("Should throw exception when username exists")
    void register_ShouldThrowException_WhenUsernameExists() {
        when(userRepository.existsByUsername("newuser")).thenReturn(true);

        HttpBadRequest exception = assertThrows(
                HttpBadRequest.class,
                () -> authService.register(testRegisterDTO)
        );
        assertEquals("Username already exists", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void login_ShouldReturnJwtResponse_WhenValidCredentials() {
        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(auth.getPrincipal()).thenReturn(testUserDetails);
        when(jwtProvider.generateToken("test@example.com")).thenReturn("jwt-token");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        JwtResponse result = authService.login(testLoginForm);

        assertNotNull(result);
        assertEquals("jwt-token", result.getAccessToken());
        assertTrue(result.getNeedChangePassword());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("Should change password successfully")
    void changePassword_ShouldChangePassword_WhenValidData() {
        ChangePasswordDTO dto = ChangePasswordDTO.builder()
                .currentPassword("oldPassword")
                .newPassword("NewPassword123")
                .confirmPassword("NewPassword123")
                .build();

        setupSecurityContext();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPassword", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.matches("NewPassword123", "encodedPassword")).thenReturn(false);
        when(passwordEncoder.encode("NewPassword123")).thenReturn("newEncodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        authService.changePassword(dto);

        verify(userRepository).save(any(User.class));
        verify(refreshTokenRepository).revokeAllByUser(testUser);
        verify(passwordEncoder).encode("NewPassword123");
    }

    @Test
    @DisplayName("Should return current user profile")
    void getCurrentUserProfile_ShouldReturnProfile_WhenUserAuthenticated() {
        setupSecurityContext();
        testUser.setProfile(UserProfile.builder().user(testUser).build());
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        UserProfileDTO result = authService.getCurrentUserProfile();

        assertNotNull(result);
        assertEquals(testUser.getEmail(), result.getEmail());
    }

    private void setupSecurityContext() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                testUserDetails, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);
    }
}