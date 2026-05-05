package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.model.ClassSession;

import java.util.List;

public interface ClassSessionService {
    List<ClassSession> getSessionsByClass(Integer classId);
    Object getSessionDetails(Integer sessionId);
    int generateSessionsFromTimetable(Integer classId);
}
