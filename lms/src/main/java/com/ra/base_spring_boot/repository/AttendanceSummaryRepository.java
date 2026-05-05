package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.AttendanceSummary;
import com.ra.base_spring_boot.model.AttendanceSummaryId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceSummaryRepository extends JpaRepository<AttendanceSummary, AttendanceSummaryId> {

    List<AttendanceSummary> findByIdClassId(Integer classId);

    List<AttendanceSummary> findByIdStudentId(Integer studentId);

    List<AttendanceSummary> findByIdClassIdOrderByAttendanceRateDesc(Integer classId);
}