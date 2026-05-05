package com.ra.base_spring_boot.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class TimetableConflictException extends RuntimeException {
    public TimetableConflictException(String message) {
        super(message);
    }
}
