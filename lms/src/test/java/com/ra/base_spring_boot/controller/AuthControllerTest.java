package com.ra.base_spring_boot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ra.base_spring_boot.dto.ChangePasswordDTO;
import com.ra.base_spring_boot.dto.UserProfileDTO;
import com.ra.base_spring_boot.dto.req.FormLogin;
import com.ra.base_spring_boot.dto.req.FormRegisterDTO;
import com.ra.base_spring_boot.dto.resp.JwtResponse;
import com.ra.base_spring_boot.dto.resp.UserDTO;
import com.ra.base_spring_boot.exception.HttpBadRequest;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.services.IAuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@DisplayName("Auth Controller Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IAuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    private FormRegisterDTO testRegisterDTO;
    private FormLogin testLoginForm;
    private JwtResponse testJwtResponse;
    private UserProfileDTO testUserProfile;
    private UserDTO testUserDTO;

    @BeforeEach
    void setUp() {
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

        testUserProfile = UserProfileDTO.builder()
                .userId(1)
                .firstName("Test")
                .lastName("User")
                .email("test@example.com")
                .roleName(RoleName.ROLE_USER)
                .createdAt(LocalDateTime.now())
                .build();

        testJwtResponse = JwtResponse.builder()
                .accessToken("jwt-token")
                .user(testUserProfile)
                .roles(Set.of("ROLE_USER"))
                .needChangePassword(false)
                .build();

        testUserDTO = UserDTO.builder()
                .id(1)
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .roleName(RoleName.ROLE_USER)
                .build();
    }

    @Test
    @DisplayName("Should register user successfully")
    void register_ShouldRegisterUser_WhenValidData() throws Exception {
        doNothing().when(authService).register(any(FormRegisterDTO.class));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRegisterDTO))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User registered successfully"));

        verify(authService).register(any(FormRegisterDTO.class));
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void login_ShouldReturnJwtResponse_WhenValidCredentials() throws Exception {
        when(authService.login(any(FormLogin.class))).thenReturn(testJwtResponse);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testLoginForm))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("jwt-token"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.needChangePassword").value(false));

        verify(authService).login(any(FormLogin.class));
    }

    @Test
    @DisplayName("Should change password successfully")
    @WithMockUser
    void changePassword_ShouldChangePassword_WhenValidData() throws Exception {
        ChangePasswordDTO changePasswordDTO = ChangePasswordDTO.builder()
                .currentPassword("oldPassword")
                .newPassword("NewPassword123")
                .confirmPassword("NewPassword123")
                .build();

        doNothing().when(authService).changePassword(any(ChangePasswordDTO.class));

        mockMvc.perform(put("/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changePasswordDTO))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));

        verify(authService).changePassword(any(ChangePasswordDTO.class));
    }

    @Test
    @DisplayName("Should return current user profile")
    @WithMockUser
    void getCurrentUserProfile_ShouldReturnProfile_WhenAuthenticated() throws Exception {
        when(authService.getCurrentUserProfile()).thenReturn(testUserProfile);

        mockMvc.perform(get("/auth/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.firstName").value("Test"))
                .andExpect(jsonPath("$.lastName").value("User"));

        verify(authService).getCurrentUserProfile();
    }
}