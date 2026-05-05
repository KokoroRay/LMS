package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.req.LessonResourceRequestDTO;
import com.ra.base_spring_boot.dto.resp.LessonResourceDTO;
import com.ra.base_spring_boot.services.LessonResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
public class LessonResourceController {

    private final LessonResourceService resourceService;

    // Lấy danh sách tài nguyên của một bài học
    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<List<LessonResourceDTO>> getResources(@PathVariable Integer lessonId) {
        return ResponseEntity.ok(resourceService.getResourcesByLesson(lessonId));
    }

    // Tạo mới tài nguyên
    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> addResource(@RequestBody LessonResourceRequestDTO dto) {
        try {
            LessonResourceDTO created = resourceService.addResource(dto);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Xóa tài nguyên theo ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResource(@PathVariable Integer id) {
        try {
            resourceService.deleteResource(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // Cập nhật tài nguyên
    @PutMapping(value = "/{id}", consumes = "application/json")
    public ResponseEntity<?> updateResource(@PathVariable Integer id, @RequestBody LessonResourceRequestDTO dto) {
        try {
            LessonResourceDTO updated = resourceService.updateResource(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}
