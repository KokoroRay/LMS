package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.UserDTO;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/teachers")
    public ResponseEntity<ResponseWrapper<List<UserDTO>>> getAllActiveTeachers() {
        List<User> teachers = userRepository.findAllActiveTeachers();
        List<UserDTO> teacherDTOs = teachers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ResponseWrapper.<List<UserDTO>>builder()
                .status(HttpStatus.OK)
                .message("Retrieved " + teacherDTOs.size() + " active teachers")
                .data(teacherDTOs)
                .build());
    }


    @GetMapping("/by-role/{roleId}")
    public ResponseEntity<ResponseWrapper<List<UserDTO>>> getUsersByRole(@PathVariable Integer roleId) {
        List<User> users = userRepository.findByRoleId(roleId);
        List<UserDTO> userDTOs = users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ResponseWrapper.<List<UserDTO>>builder()
                .status(HttpStatus.OK)
                .message("Retrieved " + userDTOs.size() + " users with role_id=" + roleId)
                .data(userDTOs)
                .build());
    }

    @GetMapping("/{userId}/is-teacher")
    public ResponseEntity<ResponseWrapper<Boolean>> checkIsTeacher(@PathVariable Integer userId) {
        boolean isTeacher = userRepository.isTeacher(userId);
        
        return ResponseEntity.ok(ResponseWrapper.<Boolean>builder()
                .status(HttpStatus.OK)
                .message(isTeacher ? "User is a teacher" : "User is not a teacher")
                .data(isTeacher)
                .build());
    }

    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
                .userId(user.getId())
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .roleName(user.getRole() != null ? user.getRole().getRoleName().name() : null)
                .build();
    }
}
