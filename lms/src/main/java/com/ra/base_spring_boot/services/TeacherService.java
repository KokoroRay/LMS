package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.UserProfileDTO;
import com.ra.base_spring_boot.model.Role;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.UserProfile;
import com.ra.base_spring_boot.model.constants.DefaultPassword;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.model.constants.UserStatus;
import com.ra.base_spring_boot.repository.IRoleRepository;
import com.ra.base_spring_boot.repository.IUserRepository;
import com.ra.base_spring_boot.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class    TeacherService {

    private final IUserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final IRoleRepository roleRepository;
    private final CloudinaryService cloudinaryService;
    private final PasswordEncoder passwordEncoder;

    // -------------------- Create teacher --------------------
    public UserProfileDTO createTeacher(UserProfileDTO dto, MultipartFile avatar) throws IOException {
        Role teacherRole = roleRepository.findByRoleName(RoleName.ROLE_MODERATOR)
                .orElseThrow(() -> new RuntimeException("Teacher role not found"));

        // 🧩 1. Tạo User
        User user = User.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .username(dto.getEmail()) // username = email
                .passwordHash(passwordEncoder.encode(DefaultPassword.TEACHER_DEFAULT))
                .status(UserStatus.ACTIVE)
                .role(teacherRole)
                .build();

        // 🖼️ 2. Upload avatar (nếu có)
        if (avatar != null && !avatar.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(avatar);
            user.setAvatarUrl(imageUrl);
        }

        // 📄 3. Tạo UserProfile
        UserProfile profile = UserProfile.builder()
                .teacherCode(dto.getTeacherCode())
                .address(dto.getAddress())
                .city(dto.getCity())
                .country(dto.getCountry())
                .occupation(dto.getOccupation())
                .bio(dto.getBio())
                .build();

        // Liên kết 2 chiều
        profile.setUser(user);
        user.setProfile(profile);

        // 💾 4. Lưu vào DB
        User savedUser = userRepository.save(user);

        return toDTO(savedUser);
    }

    // -------------------- Get all teachers --------------------
    public List<UserProfileDTO> getAllTeachers() {
        List<User> teachers = userRepository.findByRoleName(RoleName.ROLE_MODERATOR);
        return teachers.stream().map(this::toDTO).collect(Collectors.toList());
    }

    // -------------------- Mapping User -> DTO --------------------
    private UserProfileDTO toDTO(User user) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setUserId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());

        if (user.getProfile() != null) {
            dto.setTeacherCode(user.getProfile().getTeacherCode());
            dto.setAddress(user.getProfile().getAddress());
            dto.setCity(user.getProfile().getCity());
            dto.setCountry(user.getProfile().getCountry());
            dto.setOccupation(user.getProfile().getOccupation());
            dto.setBio(user.getProfile().getBio());
        }

        return dto;
    }
}
