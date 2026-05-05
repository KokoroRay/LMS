package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.req.SessionRequestDTO;
import com.ra.base_spring_boot.dto.resp.SessionDTO;
import com.ra.base_spring_boot.services.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    /**
     * Lấy tất cả session
     */
    @GetMapping
    public ResponseEntity<List<SessionDTO>> getAll() {
        return ResponseEntity.ok(sessionService.findAll());
    }

    /**
     * Lấy session theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<SessionDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(sessionService.findById(id));
    }

    /**
     * Tạo session mới
     */
    @PostMapping
    public ResponseEntity<SessionDTO> create(@RequestBody SessionRequestDTO dto) {
        return ResponseEntity.ok(sessionService.save(dto));
    }

    /**
     * Cập nhật session
     */
    @PutMapping("/{id}")
    public ResponseEntity<SessionDTO> update(@PathVariable Integer id, @RequestBody SessionRequestDTO dto) {
        return ResponseEntity.ok(sessionService.update(id, dto));
    }

    /**
     * Xóa session theo ID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        sessionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lấy danh sách session theo courseId
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<SessionDTO>> getByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(sessionService.findByCourseId(courseId));
    }
}
