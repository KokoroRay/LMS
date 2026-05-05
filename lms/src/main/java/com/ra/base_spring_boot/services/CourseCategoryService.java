package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.resp.CourseCategoryDTO;

import java.util.List;
import java.util.Optional;

public interface CourseCategoryService {

    List<CourseCategoryDTO> getAllCategories();

    Optional<CourseCategoryDTO> getCategoryById(Integer id);

    CourseCategoryDTO createCategory(CourseCategoryDTO dto);

    Optional<CourseCategoryDTO> updateCategory(Integer id, CourseCategoryDTO dto);

    boolean deleteCategory(Integer id);


    boolean existsByName(String name);

    boolean existsByNameAndNotId(String name, Integer id);
}
