package com.ra.base_spring_boot.controller;


import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.dto.req.CreateUserDTO;
import com.ra.base_spring_boot.dto.req.UpdateUserDTO;
import com.ra.base_spring_boot.dto.resp.UserDTO;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.services.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class AdminController {

    private final IUserService userService;

    @GetMapping("/users")
    public ResponseEntity<ResponseWrapper<Page<UserDTO>>> getAllUser(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sort){

        Pageable pageable = PageRequest.of(page, size, Sort.by(sort));
        Page<UserDTO> users =  userService.findAll(pageable);

        return ResponseEntity.ok(ResponseWrapper.<Page<UserDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get all users successfully")
                .data(users)
                .build());
    }

    @GetMapping("/users/role/{roleName}")
    public ResponseEntity<ResponseWrapper<List<UserDTO>>> getUserByRole(
            @PathVariable RoleName roleName) {
        List<UserDTO> users = userService.findByRole(roleName);

        return ResponseEntity.ok(ResponseWrapper.<List<UserDTO>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get role successfully")
                .data(users)
                .build());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ResponseWrapper<UserDTO>> getUserById(
            @PathVariable Integer id) {
        UserDTO users =  userService.findById(id);
        return ResponseEntity.ok(ResponseWrapper.<UserDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Get user successfully")
                .data(users)
                .build());
    }

    @PostMapping("/users")
    public ResponseEntity<ResponseWrapper<UserDTO>> createUser(
            @Valid @RequestBody CreateUserDTO createUserDTO) {
        UserDTO users =  userService.create(createUserDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseWrapper.<UserDTO>builder()
                .status(HttpStatus.CREATED)
                .code(HttpStatus.CREATED.value())
                .message("Create user successfully")
                .data(users)
                .build()
        );
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ResponseWrapper<UserDTO>> updateUser (
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserDTO updateUserDTO) {
        UserDTO users = userService.update(id, updateUserDTO);
        return ResponseEntity.ok(ResponseWrapper.<UserDTO>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Update user successfully")
                .data(users)
                .build()
        );
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ResponseWrapper<Void>> deleteUser (@PathVariable Integer id) {
        userService.delete(id);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Delete user successfully")
                .build());
    }

    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<ResponseWrapper<UserDTO>> changeUserRole(
            @PathVariable Integer userId,
            @RequestParam RoleName roleName) {
        UserDTO users = userService.changeRole(userId, roleName);
        return ResponseEntity.ok(ResponseWrapper.<UserDTO>builder().
                status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Change role user successfully")
                .data(users)
                .build());
    }



}
