package com.ra.base_spring_boot.services;


import com.ra.base_spring_boot.dto.req.StudentRequestDTO;
import com.ra.base_spring_boot.dto.resp.StudentResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface IStudentService {

    Page<StudentResponseDTO> findAll(Pageable pageable, String keyword, Boolean excludeStudentsInOtherActiveClasses);
    StudentResponseDTO findById(Integer id);
    StudentResponseDTO create(StudentRequestDTO studentRequestDTO);
    StudentResponseDTO update(Integer id, StudentRequestDTO studentRequestDTO);
    void delete(Integer id);
    void importFromExcel(MultipartFile file) throws Exception;
    Boolean existsByEmail(String email);
    boolean existsByStudentCode(String studentCode);
}
