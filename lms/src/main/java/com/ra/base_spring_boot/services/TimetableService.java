package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.TimetableDTO;
import com.ra.base_spring_boot.dto.resp.TimetableResponseDTO;
import com.ra.base_spring_boot.dto.ClassDTO;
import com.ra.base_spring_boot.dto.TimetableStudentDTO;
import com.ra.base_spring_boot.dto.resp.CourseDTO;
import java.util.List;

public interface TimetableService {
    List<TimetableResponseDTO> findAll();
    TimetableResponseDTO findById(Integer id);
    TimetableResponseDTO create(TimetableDTO timetableDTO);
    TimetableResponseDTO update(Integer id, TimetableDTO timetableDTO);
    void delete(Integer id);
    List<TimetableResponseDTO> findByClassId(Integer classId);
    List<TimetableResponseDTO> findAllSlotsByClassId(Integer classId);
    List<TimetableResponseDTO> findMyEntireTimetable();
    List<ClassDTO> findClassesByInstructorId();
    List<TimetableStudentDTO> getStudentTimetableWithAttendance(Integer studentId);

    List<CourseDTO> findCoursesByClassIdAndInstructor(Integer classId, Integer instructorId);
}