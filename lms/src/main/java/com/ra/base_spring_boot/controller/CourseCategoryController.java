package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.resp.CourseCategoryDTO;
import com.ra.base_spring_boot.services.CourseCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CourseCategoryController {

    private final CourseCategoryService categoryService;

    // ------------------- GET -------------------

    /**
     * Lấy danh sách tất cả danh mục khóa học
     * @return ResponseEntity chứa danh sách {@link CourseCategoryDTO}
     */
    @GetMapping
    public ResponseEntity<List<CourseCategoryDTO>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    /**
     * Lấy thông tin chi tiết của một danh mục theo ID
     * @param id ID của danh mục
     * @return ResponseEntity chứa {@link CourseCategoryDTO} nếu tồn tại, hoặc 404 nếu không tìm thấy
     */
    @GetMapping("/{id}")
    public ResponseEntity<CourseCategoryDTO> getCategoryById(@PathVariable Integer id) {
        return categoryService.getCategoryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ------------------- CREATE -------------------

    /**
     * Tạo mới một danh mục khóa học
     * @param dto đối tượng {@link CourseCategoryDTO} chứa dữ liệu danh mục mới
     * @return 201 (CREATED) nếu tạo thành công,
     *         409 (CONFLICT) nếu tên danh mục đã tồn tại
     */
    @PostMapping
    public ResponseEntity<?> createCategory(@RequestBody CourseCategoryDTO dto) {
        // Kiểm tra trùng tên danh mục
        if (categoryService.existsByName(dto.getName())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "status", 409,
                            "message", "Category name '" + dto.getName() + "' already exists"
                    ));
        }

        // Tạo mới danh mục
        CourseCategoryDTO created = categoryService.createCategory(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ------------------- UPDATE -------------------

    /**
     * Cập nhật thông tin của một danh mục khóa học
     * @param id ID của danh mục cần cập nhật
     * @param dto dữ liệu cập nhật {@link CourseCategoryDTO}
     * @return 200 nếu cập nhật thành công,
     *         404 nếu không tìm thấy danh mục,
     *         409 nếu tên bị trùng với danh mục khác
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Integer id,
                                            @RequestBody CourseCategoryDTO dto) {
        // Kiểm tra trùng tên ở danh mục khác (có ID khác)
        if (categoryService.existsByNameAndNotId(dto.getName(), id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "status", 409,
                            "message", "Category name '" + dto.getName() + "' already exists"
                    ));
        }

        // Gọi service để cập nhật
        return categoryService.updateCategory(id, dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ------------------- DELETE -------------------

    /**
     * Xóa danh mục theo ID
     * @param id ID của danh mục cần xóa
     * @return 204 (No Content) nếu xóa thành công, hoặc 404 nếu không tìm thấy
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Integer id) {
        if (categoryService.deleteCategory(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
