package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.ChangePasswordDTO;
import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.UserProfileDTO;
import com.ra.base_spring_boot.dto.req.FormLogin;
import com.ra.base_spring_boot.dto.req.FormRegisterDTO;
import com.ra.base_spring_boot.dto.req.UpdateProfileDTO;
import com.ra.base_spring_boot.dto.req.UpdateUserDTO;
import com.ra.base_spring_boot.dto.req.ForgotPasswordRequest;
import com.ra.base_spring_boot.dto.req.ResetPasswordRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ra.base_spring_boot.dto.resp.UserDTO;
import com.ra.base_spring_boot.services.CloudinaryService;
import com.ra.base_spring_boot.services.IAuthService;
import com.ra.base_spring_boot.services.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController
{
    private final IAuthService authService;
    private final IUserService userService;
    private final CloudinaryService cloudinaryService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/login")
    public ResponseEntity<?> handleLogin(@Valid @RequestBody FormLogin formLogin)
    {
        return ResponseEntity.ok().body(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(200)
                        .data(authService.login(formLogin))
                        .build()
        );
    }

    @PostMapping("/register")
    public ResponseEntity<?> handleRegister(@Valid @RequestBody FormRegisterDTO formRegister)
    {
        authService.register(formRegister);
        return ResponseEntity.created(URI.create("/auth/register")).body(
                ResponseWrapper.builder()
                        .status(HttpStatus.CREATED)
                        .code(201)
                        .data("Register successfully")
                        .build()
        );
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@ModelAttribute ChangePasswordDTO dto){
        authService.changePassword(dto);
        return ResponseEntity.ok(ResponseWrapper.builder()
                .status(HttpStatus.OK)
                .code(200)
                .data("Password changed successfully")
                .build());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request)
    {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok().body(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(200)
                        .data("Password reset link sent to your email.")
                        .build()
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request)
    {
        authService.resetPassword(request);
        return ResponseEntity.ok().body(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(200)
                        .data("Password reset successfully.")
                        .build()
        );
    }


//    @GetMapping("/me")
//    public ResponseEntity<?> getCurrentUser() {
//        return ResponseEntity.ok().body(ResponseWrapper.builder()
//                .status(HttpStatus.OK)
//                .code(200)
//                .data(authService.getCurrentUser())
//                .build());
//    }

    @GetMapping("/profile")
    public  ResponseEntity<?> getCurrentUserProfile() {
        try {
            UserProfileDTO userProfileDTO = authService.getCurrentUserProfile();
            return ResponseEntity.ok(ResponseWrapper.builder()
                    .status(HttpStatus.OK)
                    .code(HttpStatus.OK.value())
                    .message("Get user profile successfully")
                    .data(userProfileDTO)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseWrapper.builder()
                    .status(HttpStatus.NOT_FOUND)
                    .code(HttpStatus.NOT_FOUND.value())
                    .message("user profile is not found " + e.getMessage())
                    .build());
        }
    }

    @PutMapping(value = "/profile", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateProfile(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "avatar", required = false) MultipartFile file) {
        try {
            UserDTO current = authService.getCurrentUser();
            Integer userId = current.getId();
            UpdateProfileDTO profileDTO = objectMapper.readValue(dataJson, UpdateProfileDTO.class);
            if (file != null && !file.isEmpty()) {
                String imageUrl = cloudinaryService.uploadImage(file);
                profileDTO.setAvatarUrl(imageUrl);
            }
            UpdateUserDTO updateUserDTO = UpdateUserDTO.builder()
                    .firstName(profileDTO.getFirstName())
                    .lastName(profileDTO.getLastName())
                    .phone(profileDTO.getPhone())
                    .dateOfBirth(profileDTO.getDateOfBirth())
                    .gender(profileDTO.getGender())
                    .avatarUrl(profileDTO.getAvatarUrl())
                    .build();

            UserDTO updated = userService.update(userId, updateUserDTO);
            return ResponseEntity.ok(ResponseWrapper.builder()
                    .status(HttpStatus.OK)
                    .code(HttpStatus.OK.value())
                    .message("Profile updated successfully")
                    .data(updated)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseWrapper.builder()
                    .status(HttpStatus.BAD_REQUEST)
                    .code(HttpStatus.BAD_REQUEST.value())
                    .message("Update profile failed: " + e.getMessage())
                    .build());
        }
    }
}
