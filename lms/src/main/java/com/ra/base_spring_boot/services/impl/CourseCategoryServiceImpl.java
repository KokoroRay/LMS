package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.resp.CourseCategoryDTO;
import com.ra.base_spring_boot.dto.resp.CourseDTO;
import com.ra.base_spring_boot.model.Course;
import com.ra.base_spring_boot.model.CourseCategory;
import com.ra.base_spring_boot.repository.CourseCategoryRepository;
import com.ra.base_spring_boot.repository.CourseRepository;
import com.ra.base_spring_boot.services.CourseCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseCategoryServiceImpl implements CourseCategoryService {

    private final CourseCategoryRepository categoryRepository;
    private final CourseRepository courseRepository;

    @Override
    public List<CourseCategoryDTO> getAllCategories() {
        // 1. Fetch all categories
        List<CourseCategory> categories = categoryRepository.findAll();
        if (categories.isEmpty()) {
            return new ArrayList<>();
        }

        // 2. Get all category IDs
        List<Integer> categoryIds = categories.stream()
                .map(CourseCategory::getCategoryId)
                .collect(Collectors.toList());

        // 3. Fetch all courses for those category IDs in a single query
        List<Course> courses = courseRepository.findByCategory_CategoryIdIn(categoryIds);

        // 4. Group courses by category ID
        Map<Integer, List<Course>> coursesByCategory = courses.stream()
                .filter(course -> course.getCategory() != null)
                .collect(Collectors.groupingBy(course -> course.getCategory().getCategoryId()));

        // 5. Map to DTOs
        return categories.stream()
                .map(category -> toDTO(category, coursesByCategory.getOrDefault(category.getCategoryId(), new ArrayList<>())))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<CourseCategoryDTO> getCategoryById(Integer id) {
        return categoryRepository.findById(id).map(this::toDTO);
    }

    @Override
    public CourseCategoryDTO createCategory(CourseCategoryDTO dto) {
        if (categoryRepository.existsByName(dto.getName())) {
            throw new RuntimeException("Category name '" + dto.getName() + "' already exists");
        }

        CourseCategory entity = CourseCategory.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .build();

        return toDTO(categoryRepository.save(entity));
    }

    @Override
    public Optional<CourseCategoryDTO> updateCategory(Integer id, CourseCategoryDTO dto) {
        return categoryRepository.findById(id).map(entity -> {
            Optional<CourseCategory> existing = categoryRepository.findByName(dto.getName());
            if (existing.isPresent() && !existing.get().getCategoryId().equals(id)) {
                throw new RuntimeException("Category name '" + dto.getName() + "' already exists");
            }

            entity.setName(dto.getName());
            entity.setDescription(dto.getDescription());
            return toDTO(categoryRepository.save(entity));
        });
    }

    @Override
    public boolean deleteCategory(Integer id) {
        if (categoryRepository.existsById(id)) {
            List<Course> associatedCourses = courseRepository.findByCategory_CategoryId(id);
            for (Course course : associatedCourses) {
                course.setCategory(null);
                courseRepository.save(course);
            }
            categoryRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public boolean existsByName(String name) {
        return categoryRepository.existsByName(name);
    }

    public boolean existsByNameAndNotId(String name, Integer id) {
        return categoryRepository.findByName(name)
                .map(entity -> !entity.getCategoryId().equals(id))
                .orElse(false);
    }

    private CourseCategoryDTO toDTO(CourseCategory entity) {
        List<Course> courses = courseRepository.findByCategory_CategoryId(entity.getCategoryId());
        return toDTO(entity, courses);
    }

    private CourseCategoryDTO toDTO(CourseCategory entity, List<Course> courses) {
        List<CourseDTO> courseDTOs = courses.stream()
                .map(this::toCourseDTO)
                .collect(Collectors.toList());

        return CourseCategoryDTO.builder()
                .categoryId(entity.getCategoryId())
                .name(entity.getName())
                .description(entity.getDescription())
                .courses(courseDTOs)
                .build();
    }

    private CourseDTO toCourseDTO(Course course) {
        return CourseDTO.builder()
                .courseId(course.getCourseId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .shortDescription(course.getShortDescription())
                .description(course.getDescription())
                .price(course.getPrice())
                .level(course.getLevel())
                .categoryId(course.getCategory() != null ? course.getCategory().getCategoryId() : null)
                .createdById(course.getCreatedBy() != null ? course.getCreatedBy().getId() : null)
                .status(course.getStatus())
                .thumbnailUrl(course.getThumbnailUrl())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }
}