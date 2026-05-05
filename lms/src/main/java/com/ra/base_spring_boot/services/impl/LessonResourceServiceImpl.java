package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.req.LessonResourceRequestDTO;
import com.ra.base_spring_boot.dto.resp.LessonResourceDTO;
import com.ra.base_spring_boot.exception.HttpBadRequest;
import com.ra.base_spring_boot.model.Lesson;
import com.ra.base_spring_boot.model.LessonResource;
import com.ra.base_spring_boot.repository.LessonRepository;
import com.ra.base_spring_boot.repository.LessonResourceRepository;
import com.ra.base_spring_boot.services.LessonResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LessonResourceServiceImpl implements LessonResourceService {

    private final LessonResourceRepository resourceRepository;
    private final LessonRepository lessonRepository;

    @Override
    public List<LessonResourceDTO> getResourcesByLesson(Integer lessonId) {
        return resourceRepository.findByLessonLessonId(lessonId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public LessonResourceDTO addResource(LessonResourceRequestDTO dto) {
        Lesson lesson = lessonRepository.findById(dto.getLessonId())
                .orElseThrow(() -> new HttpBadRequest("Lesson not found."));

        if (dto.getFileUrl() == null || dto.getFileUrl().isBlank()) {
            throw new HttpBadRequest("File URL cannot be empty.");
        }

        LessonResource resource = LessonResource.builder()
                .title(dto.getTitle())
                .fileUrl(dto.getFileUrl())
                .resourceType(dto.getResourceType())
                .lesson(lesson)
                .build();

        LessonResource saved = resourceRepository.save(resource);
        return mapToDTO(saved);
    }

    @Override
    public LessonResourceDTO updateResource(Integer id, LessonResourceRequestDTO dto) {
        LessonResource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new HttpBadRequest("Resource not found for update."));

        if (dto.getLessonId() != null) {
            Lesson lesson = lessonRepository.findById(dto.getLessonId())
                    .orElseThrow(() -> new HttpBadRequest("Lesson not found."));
            existing.setLesson(lesson);
        }

        if (dto.getTitle() != null) existing.setTitle(dto.getTitle());
        if (dto.getFileUrl() != null) existing.setFileUrl(dto.getFileUrl());
        if (dto.getResourceType() != null) existing.setResourceType(dto.getResourceType());

        LessonResource updated = resourceRepository.save(existing);
        return mapToDTO(updated);
    }

    @Override
    public void deleteResource(Integer resourceId) {
        if (!resourceRepository.existsById(resourceId)) {
            throw new HttpBadRequest("Resource not found for deletion.");
        }
        resourceRepository.deleteById(resourceId);
    }

    private LessonResourceDTO mapToDTO(LessonResource entity) {
        return LessonResourceDTO.builder()
                .resourceId(entity.getResourceId())
                .title(entity.getTitle())
                .fileUrl(entity.getFileUrl())
                .resourceType(entity.getResourceType())
                .uploadedAt(entity.getUploadedAt())
                .lessonId(entity.getLesson().getLessonId())
                .build();
    }
}
