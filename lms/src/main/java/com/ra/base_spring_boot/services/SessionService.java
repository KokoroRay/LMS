package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.req.SessionRequestDTO;
import com.ra.base_spring_boot.dto.resp.SessionDTO;

import java.util.List;

public interface SessionService {

    List<SessionDTO> findAll();

    SessionDTO findById(Integer id);

    SessionDTO save(SessionRequestDTO dto);

    SessionDTO update(Integer id, SessionRequestDTO dto);

    void delete(Integer id);

    List<SessionDTO> findByCourseId(Integer courseId);
}
