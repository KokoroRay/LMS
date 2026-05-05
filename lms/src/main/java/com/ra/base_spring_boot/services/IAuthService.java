package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.ChangePasswordDTO;
import com.ra.base_spring_boot.dto.UserProfileDTO;
import com.ra.base_spring_boot.dto.req.FormLogin;
import com.ra.base_spring_boot.dto.req.FormRegisterDTO;
import com.ra.base_spring_boot.dto.req.ResetPasswordRequest;
import com.ra.base_spring_boot.dto.resp.JwtResponse;
import com.ra.base_spring_boot.dto.resp.UserDTO;
import com.ra.base_spring_boot.model.User;

public interface IAuthService {
    void register(FormRegisterDTO formRegister);
    JwtResponse login(FormLogin formLogin);
    void changePassword(ChangePasswordDTO dto);
    UserProfileDTO getCurrentUserProfile();
    UserDTO getCurrentUser();
    void forgotPassword(String email);
    void resetPassword(ResetPasswordRequest request);
    User getCurrentUserEntity();
}