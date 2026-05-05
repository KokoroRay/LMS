package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.ClassDTO;
import com.ra.base_spring_boot.dto.req.ClassRequestDTO;
import com.ra.base_spring_boot.dto.req.ClassSubjectAssignmentDTO;
import com.ra.base_spring_boot.model.constants.ClassStatus;

import java.util.List;

public interface IClassService {
    List<ClassDTO> getAllClasses();
    ClassDTO getClassById(Integer classId);
    ClassDTO createClass(ClassRequestDTO classRequestDTO);
    ClassDTO updateClass(Integer classId, ClassRequestDTO classRequestDTO);
    void deleteClass(Integer classId);
    ClassDTO updateStatus(Integer id, ClassStatus status);
    Long countStudentsInClass(Integer classId);

    void bulkEnrollStudents(Integer classId, List<Integer> studentIds);
    
    // Thêm methods mới cho teacher assignment
    ClassSubjectAssignmentDTO addTeacherToClass(Integer classId, ClassSubjectAssignmentDTO assignmentDTO);
    void removeTeacherFromClass(Integer classId, Integer courseId);
}
