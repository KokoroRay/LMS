package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.ChangePasswordDTO;
import com.ra.base_spring_boot.dto.UserProfileDTO;
import com.ra.base_spring_boot.dto.req.FormLogin;
import com.ra.base_spring_boot.dto.req.FormRegisterDTO;
import com.ra.base_spring_boot.dto.req.ResetPasswordRequest;
import com.ra.base_spring_boot.services.IEmailService;
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
import com.ra.base_spring_boot.services.IAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {
    private final IUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final IRoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final IEmailService emailService;

    @Override
    public void register(FormRegisterDTO formRegister) {
        if (userRepository.existsByUsername(formRegister.getUsername())) {
            throw new HttpBadRequest("Username already exists");
        }
        if (userRepository.existsByEmail(formRegister.getEmail())) {
            throw new HttpBadRequest("Email already exists");
        }

        Role studentRole = roleRepository.findByRoleName(RoleName.ROLE_USER)
                .orElseThrow(() -> new HttpBadRequest("Role not found"));

        User user = User.builder()
                .username(formRegister.getUsername())
                .email(formRegister.getEmail())
                .passwordHash(passwordEncoder.encode("123456"))
                .firstName(formRegister.getFirstName())
                .lastName(formRegister.getLastName())
                .role(studentRole)
                .status(UserStatus.ACTIVE)
                .firstLogin(true)
                .build();

        userRepository.save(user);
    }

    @Override
    public JwtResponse login(FormLogin formLogin) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(formLogin.getEmail(), formLogin.getPassword())
            );

            MyUserDetails principal = (MyUserDetails) authentication.getPrincipal();
            String token = jwtProvider.generateToken(principal.getUsername());

            User user = userRepository.findByEmail(principal.getUsername())
                    .orElseThrow(() -> new HttpBadRequest("User not found"));

            if(user.getProfile() == null) {
                UserProfile newProfile = UserProfile.builder()
                        .user(user)
                        .build();
                user.setProfile(newProfile);
                userRepository.save(user); // Lưu lại để user có profile
            }

            UserProfileDTO userProfile = convertToProfileDTO(user);

            Set<String> roles = principal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());

            boolean mustChangePassword = Boolean.TRUE.equals(user.getFirstLogin());

            return JwtResponse.builder()
                    .accessToken(token)
                    .user(userProfile)
                    .roles(roles)
                    .needChangePassword(mustChangePassword)
                    .build();

        } catch (DisabledException e) {
            throw new HttpBadRequest("Tài khoản của bạn đã bị khoá");
        } catch (AuthenticationException e) {
            throw new HttpBadRequest("Email or password is incorrect");
        }
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordDTO dto) {
        User currentUser = getCurrentUserEntity();

        if (!passwordEncoder.matches(dto.getCurrentPassword(), currentUser.getPasswordHash())) {
            throw new HttpBadRequest("Current password is incorrect");
        }

        if (passwordEncoder.matches(dto.getNewPassword(), currentUser.getPasswordHash())) {
            throw new HttpBadRequest("New password cannot be the same as the old password");
        }

        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new HttpBadRequest("New passwords do not match");
        }

        if (!dto.getNewPassword().matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")) {
            throw new HttpBadRequest("Password must be at least 8 characters and contain uppercase, lowercase, and digits");
        }

        currentUser.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        currentUser.setFirstLogin(false);
        currentUser.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(currentUser);

        refreshTokenRepository.revokeAllByUser(currentUser);

    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new HttpBadRequest("Email not found."));

        String resetToken = UUID.randomUUID().toString();

        user.setResetPasswordToken(resetToken);
        user.setTokenExpiryDate(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        String resetLink = "http://localhost:5173/reset-password?token=" + resetToken;
        emailService.sendResetPasswordEmail(user.getEmail(), resetLink);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new HttpBadRequest("New password and confirm password do not match.");
        }

        Optional<User> userOptional = userRepository.findByResetPasswordToken(request.getToken());

        if (userOptional.isEmpty()) {
            throw new HttpBadRequest("Invalid or missing reset token.");
        }

        User user = userOptional.get();

        if (user.getTokenExpiryDate() == null || user.getTokenExpiryDate().isBefore(LocalDateTime.now())) {
            throw new HttpBadRequest("Reset token has expired.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new HttpBadRequest("New password cannot be the same as the old password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setTokenExpiryDate(null);
        user.setFirstLogin(false);

        userRepository.save(user);
    }

    @Override
    public UserProfileDTO getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new HttpUnAuthorized("User not found"));
        if(user.getProfile() == null) {
            UserProfile newProfile = UserProfile.builder()
                    .user(user)
                    .build();
            user.setProfile(newProfile);
            userRepository.save(user);
        }

        return convertToProfileDTO(user);
    }

    @Override
    public UserDTO getCurrentUser() {
        User user = getCurrentUserEntity();
        // return convertToUserDTO(user); // <-- Lỗi compile ở đây
        return convertToDTO(user); // <-- Sửa lại thành tên hàm đúng
    }

    @Override
    public User getCurrentUserEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new HttpUnAuthorized("User not authenticated");
        }

        String email;
        Object principal = authentication.getPrincipal();

        if (principal instanceof MyUserDetails) {
            email = ((MyUserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            email = (String) principal;
        } else {
            throw new HttpUnAuthorized("Invalid authentication principal");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new HttpUnAuthorized("User not found"));
    }

    private UserDTO convertToDTO(User user) {
        // Kiểm tra null cho role
        RoleName roleName = null;
        if (user.getRole() != null) {
            roleName = user.getRole().getRoleName();
        }

        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .roleName(roleName)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private UserProfileDTO convertToProfileDTO(User user) {
        UserProfileDTO profileDTO = new UserProfileDTO();
        profileDTO.setUserId(user.getId());
        profileDTO.setFirstName(user.getFirstName());
        profileDTO.setLastName(user.getLastName());
        profileDTO.setEmail(user.getEmail());
        profileDTO.setPhone(user.getPhone());
        profileDTO.setAvatarUrl(user.getAvatarUrl());
        profileDTO.setCreatedAt(user.getCreatedAt());
        profileDTO.setUpdatedAt(user.getUpdatedAt());

        profileDTO.setDateOfBirth(user.getDateOfBirth());

        // ⭐ THÊM KIỂM TRA NULL CHO AN TOÀN ⭐
        RoleName roleName = null;
        if (user.getRole() != null) {
            roleName = user.getRole().getRoleName();
        }
        profileDTO.setRoleName(roleName);
        // ⭐=============================⭐

        if (user.getProfile() != null) {
            UserProfile userProfile = user.getProfile();
            profileDTO.setStudentCode(userProfile.getStudentCode());
            profileDTO.setTeacherCode(userProfile.getTeacherCode());
            profileDTO.setClassName(userProfile.getClassName());
            profileDTO.setAddress(userProfile.getAddress());
            profileDTO.setCity(userProfile.getCity());
            profileDTO.setCountry(userProfile.getCountry());
            profileDTO.setOccupation(userProfile.getOccupation());
            profileDTO.setBio(userProfile.getBio());

            if (userProfile.getLastLogin() != null) {
                profileDTO.setLastLogin(userProfile.getLastLogin().toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime());
            }
        }
        return profileDTO;
    }
}