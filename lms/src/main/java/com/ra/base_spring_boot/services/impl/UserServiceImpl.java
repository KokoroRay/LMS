package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.req.CreateUserDTO;
import com.ra.base_spring_boot.dto.req.UpdateUserDTO;
import com.ra.base_spring_boot.dto.resp.UserDTO;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.model.Role;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.model.constants.UserStatus;
import com.ra.base_spring_boot.repository.IRoleRepository;
import com.ra.base_spring_boot.repository.IUserRepository;
import com.ra.base_spring_boot.services.IUserService;
import org.springframework.data.domain.Page;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements IUserService {

    private final IUserRepository userRepository;
    private final IRoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;


    public UserServiceImpl(IUserRepository userRepository, IRoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }


    @Override
    public Page<UserDTO> findAll(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::convertToDTO);
    }

    @Override
    public List<UserDTO> findByRole(RoleName roleName) {
        return userRepository.findByRoleName(roleName).stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public UserDTO findById(Integer id) {
        User user = userRepository.findById(id).orElseThrow(() -> new HttpNotFound("User not found"));
        return convertToDTO(user);
    }
    @Override
    public User findEntityById(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new HttpNotFound("User not found"));
    }

    @Override
    public UserDTO create(CreateUserDTO createUserDTO) {
        if (userRepository.existsByUsername(createUserDTO.getUsername())) {
            throw new HttpNotFound("Username already exists");
        }
        if (userRepository.existsByEmail(createUserDTO.getEmail())) {
            throw new HttpNotFound("Email already exists");
        }

        Role role = roleRepository.findByRoleName(createUserDTO.getRoleName())
                .orElseThrow(() -> new HttpNotFound("Role not found"));
        User user = User.builder()
                .username(createUserDTO.getUsername())
                .email(createUserDTO.getEmail())
                .passwordHash(passwordEncoder.encode(createUserDTO.getPassword()))
                .firstName(createUserDTO.getFirstName())
                .lastName(createUserDTO.getLastName())
                .phone(createUserDTO.getPhone())
                .dateOfBirth(createUserDTO.getDateOfBirth())
                .gender(createUserDTO.getGender())
                .avatarUrl(createUserDTO.getAvatarUrl())
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    @Override
    public UserDTO update(Integer id, UpdateUserDTO updateUserDTO) {
        User user = userRepository.findById(id).orElseThrow(() -> new HttpNotFound("User not found"));
        if (updateUserDTO.getFirstName() != null) {
            user.setFirstName(updateUserDTO.getFirstName());
        }
        if (updateUserDTO.getLastName() != null) {
            user.setLastName(updateUserDTO.getLastName());
        }
        if (updateUserDTO.getPhone() != null) {
            user.setPhone(updateUserDTO.getPhone());
        }
        if (updateUserDTO.getDateOfBirth() != null) {
            user.setDateOfBirth(updateUserDTO.getDateOfBirth());
        }
        if (updateUserDTO.getGender() != null) {
            user.setGender(updateUserDTO.getGender());
        }
        if (updateUserDTO.getAvatarUrl() != null) {
            user.setAvatarUrl(updateUserDTO.getAvatarUrl());
        }
        if(updateUserDTO.getRoleName() != null) {
            Role role = roleRepository.findByRoleName(updateUserDTO.getRoleName())
                    .orElseThrow(() -> new HttpNotFound("Role not found"));
            user.setRole(role);
        }
        if (updateUserDTO.getStatus() != null) {
            user.setStatus(updateUserDTO.getStatus());
        }
        User updateUser = userRepository.save(user);
        return convertToDTO(updateUser);
    }

    @Override
    public void delete(Integer id) {
        User user = userRepository.findById(id).orElseThrow(() -> new HttpNotFound("User not found"));
        userRepository.delete(user);
    }

    @Override
    public UserDTO changeRole(Integer userId, RoleName roleName) {
        User user =  userRepository.findById(userId).orElseThrow(() -> new HttpNotFound("User not found"));
        Role role = roleRepository.findByRoleName(roleName).orElseThrow(() -> new HttpNotFound("Role not found"));

        user.setRole(role);

        User updateUser = userRepository.save(user);
        return convertToDTO(updateUser);
    }

    private UserDTO convertToDTO(User user) {
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
                .roleName(user.getRole().getRoleName())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
