package com.ra.base_spring_boot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ra.base_spring_boot.dto.UserProfileDTO;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.UserProfile;
import com.ra.base_spring_boot.model.Role;
import com.ra.base_spring_boot.model.constants.DefaultPassword;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.repository.IRoleRepository;
import com.ra.base_spring_boot.repository.IUserRepository;
import com.ra.base_spring_boot.services.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final IUserRepository userRepository;
    private final IRoleRepository roleRepository;
    private final CloudinaryService cloudinaryService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();


    public static class ApiResponse<T> {
        private String message;
        private T data;

        public ApiResponse(String message, T data) {
            this.message = message;
            this.data = data;
        }

        // Getter & Setter
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public T getData() { return data; }
        public void setData(T data) { this.data = data; }
    }

    // ---------------------- List all teachers ----------------------
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<ApiResponse<List<UserProfileDTO>>> getAllTeachers() {
        List<UserProfileDTO> teachers = userRepository.findByRoleName(RoleName.ROLE_MODERATOR)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>("List of teachers", teachers));
    }

    // ---------------------- Get teacher by ID ----------------------
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<ApiResponse<UserProfileDTO>> getTeacherById(@PathVariable Integer id) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty() || !optionalUser.get().getRole().getRoleName().equals(RoleName.ROLE_MODERATOR)) {
            return ResponseEntity.badRequest().body(new ApiResponse<>("Teacher not found", null));
        }
        return ResponseEntity.ok(new ApiResponse<>("Teacher details", toDTO(optionalUser.get())));
    }

    // ---------------------- Create new teacher ----------------------
    // ---------------------- Create new teacher ----------------------
    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasAnyRole('ADMIN')")  // chỉ ADMIN mới được tạo
    public ResponseEntity<ApiResponse<UserProfileDTO>> createTeacher(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "avatar", required = false) MultipartFile file
    ) throws IOException {
        UserProfileDTO dto = objectMapper.readValue(dataJson, UserProfileDTO.class);

        // --- Kiểm tra trùng email ---
        if (userRepository.existsByEmail(dto.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>("Email already exists", null));
        }

        // --- Kiểm tra trùng mã giảng viên ---
        if (dto.getTeacherCode() != null
                && !dto.getTeacherCode().trim().isEmpty()
                && userRepository.existsByTeacherCode(dto.getTeacherCode())) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>("Teacher code already exists", null));
        }

        // --- Lấy role giảng viên ---
        Role teacherRole = roleRepository.findByRoleName(RoleName.ROLE_MODERATOR)
                .orElseThrow(() -> new RuntimeException("Teacher role not found"));

        // --- Tạo đối tượng User ---
        User user = User.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .username(dto.getEmail())
                .role(teacherRole)
                .passwordHash(passwordEncoder.encode(DefaultPassword.TEACHER_DEFAULT))
                .firstLogin(true)
                .status(com.ra.base_spring_boot.model.constants.UserStatus.ACTIVE)
                .build();

        // --- Upload avatar nếu có ---
        if (file != null && !file.isEmpty()) {
            String url = cloudinaryService.uploadImage(file);
            user.setAvatarUrl(url);
        }

        // --- Tạo UserProfile ---
        UserProfile profile = UserProfile.builder()
                .teacherCode(dto.getTeacherCode())
                .address(dto.getAddress())
                .city(dto.getCity())
                .country(dto.getCountry())
                .occupation(dto.getOccupation())
                .bio(dto.getBio())
                .build();

        user.setProfile(profile);

        // --- Lưu vào DB ---
        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse<>("Teacher created successfully", toDTO(savedUser)));
    }


    // ---------------------- Update teacher ----------------------
    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<ApiResponse<UserProfileDTO>> updateTeacher(
            @PathVariable Integer id,
            @RequestPart("data") String dataJson,
            @RequestPart(value = "avatar", required = false) MultipartFile file
    ) throws IOException {

        UserProfileDTO dto = objectMapper.readValue(dataJson, UserProfileDTO.class);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (!user.getRole().getRoleName().equals(RoleName.ROLE_MODERATOR)) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>("User is not a teacher", null));
        }

        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setPhone(dto.getPhone());
        if (dto.getStatus() != null) {
            user.setStatus(dto.getStatus());
        }

        if (file != null && !file.isEmpty()) {
            String url = cloudinaryService.uploadImage(file);
            user.setAvatarUrl(url);
        }

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
        }

        profile.setTeacherCode(dto.getTeacherCode());
        profile.setAddress(dto.getAddress());
        profile.setCity(dto.getCity());
        profile.setCountry(dto.getCountry());
        profile.setOccupation(dto.getOccupation());
        profile.setBio(dto.getBio());

        user.setProfile(profile);
        User updatedUser = userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse<>("Teacher updated successfully", toDTO(updatedUser)));
    }

    // ---------------------- Delete teacher ----------------------
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<ApiResponse<Void>> deleteTeacher(@PathVariable Integer id) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty() || !optionalUser.get().getRole().getRoleName().equals(RoleName.ROLE_MODERATOR)) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>("Teacher not found", null));
        }

        userRepository.delete(optionalUser.get());
        return ResponseEntity.ok(new ApiResponse<>("Teacher deleted successfully", null));
    }

    // ---------------------- Convert User -> UserProfileDTO ----------------------
    private UserProfileDTO toDTO(User user) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setUserId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setStatus(user.getStatus());

        if (user.getProfile() != null) {
            UserProfile profile = user.getProfile();
            dto.setTeacherCode(profile.getTeacherCode());
            dto.setAddress(profile.getAddress());
            dto.setCity(profile.getCity());
            dto.setCountry(profile.getCountry());
            dto.setOccupation(profile.getOccupation());
            dto.setBio(profile.getBio());
        }
        return dto;
    }
}
