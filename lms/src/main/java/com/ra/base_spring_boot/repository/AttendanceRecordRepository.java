package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.AttendanceRecord;
import com.ra.base_spring_boot.model.ClassSession;
import com.ra.base_spring_boot.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Integer> {

    Optional<AttendanceRecord> findBySessionAndStudent(ClassSession session, User student);

    List<AttendanceRecord> findBySession_Timetable_ClassEntity_ClassId(Integer classId);

    List<AttendanceRecord> findByStudent_IdAndSession_Timetable_ClassEntity_ClassId(Integer studentId, Integer classId);

    List<AttendanceRecord> findByStudent_Id(Integer studentId);

    List<AttendanceRecord> findBySession_SessionId(Integer sessionId);
}