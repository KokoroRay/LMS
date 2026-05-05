package com.ra.base_spring_boot.services;

public interface IEmailService {

    void sendResetPasswordEmail(String toEmail, String resetLink);

}