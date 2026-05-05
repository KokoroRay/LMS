package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.UserProfileDTO;
import com.ra.base_spring_boot.dto.req.CreateUserDTO;
import com.ra.base_spring_boot.dto.req.UpdateUserDTO;
import com.ra.base_spring_boot.dto.resp.UserDTO;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.RoleName;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface IUserService {

    // Trả về DTO
    Page<UserDTO> findAll(Pageable pageable);
    List<UserDTO> findByRole(RoleName roleName);
    UserDTO findById(Integer id);
    UserDTO create(CreateUserDTO createUserDTO);
    UserDTO update(Integer id, UpdateUserDTO updateUserDTO);
    void delete(Integer id);
    UserDTO changeRole(Integer userId, RoleName roleName);

    // Trả về entity User (mới)
    User findEntityById(Integer id);
}
