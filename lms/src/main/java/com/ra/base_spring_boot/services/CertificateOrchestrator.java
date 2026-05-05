package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.model.ClassEntity;
import com.ra.base_spring_boot.model.Course;
import com.ra.base_spring_boot.model.CourseCategory;
import com.ra.base_spring_boot.repository.ClassRepository;
import com.ra.base_spring_boot.repository.CourseRepository;
import com.ra.base_spring_boot.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateOrchestrator {

    private final CourseRepository courseRepo;
    private final CourseGradeService courseGradeService;
    private final CategoryGradeService categoryGradeService;
    private final CertificateService certificateService;
    private final ClassRepository classRepo;
    private final UserRepository userRepo;

    public void processCertificateForStudent(Integer studentId, String classIdStr) {
        Integer classId = parseClassId(classIdStr);
        log.info("Bắt đầu xử lý cấp chứng chỉ cho Student: {}, Class: {}", studentId, classId);

        ClassEntity classEntity = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        CourseCategory category = classEntity.getCategory();

        // ✅ SỬA LỖI: Sử dụng courses từ class thay vì từ category
        // Vì một class có thể chỉ được gán một số course cụ thể từ category đó
        List<Course> courses = classEntity.getCourses().stream().toList();

        log.info("Class {} có {} môn học thuộc Category: {}", 
                 classId, courses.size(), category.getName());

        // 1 – Tính điểm tất cả Course được gán cho class này
        for (Course c : courses) {
            log.info("Đang tính điểm Course: {} cho Student: {}", c.getTitle(), studentId);
            courseGradeService.calculateCourseGrade(studentId, classId, c.getCourseId());
        }

        // 2 – Tính grade của Category
        log.info("Đang tính CategoryGrade cho Student: {}, Class: {}", studentId, classId);
        categoryGradeService.calculateCategoryGrade(studentId, classId);

        // 3 – Kiểm tra điều kiện cấp chứng chỉ
        boolean categoryPassed = categoryGradeService.isCategoryPassed(studentId, classId);
        log.info("Kết quả kiểm tra CategoryGrade - Student: {} PASSED: {}", studentId, categoryPassed);

        if (categoryPassed) {
            log.info("Điều kiện đủ! Đang cấp chứng chỉ cho Student: {}", studentId);
            certificateService.createCertificate(
                    userRepo.findById(studentId)
                            .orElseThrow(() -> new RuntimeException("Student not found")),
                    classEntity,
                    category
            );
        } else {
            log.warn("Student {} chưa đủ điều kiện cấp chứng chỉ (CategoryGrade không PASS)", studentId);
        }
    }

    // ✅ THÊM PHƯƠNG THỨC DEBUG để kiểm tra trạng thái
    public java.util.Map<String, Object> debugCertificateStatus(Integer studentId, String classIdStr) {
        Integer classId = parseClassId(classIdStr);
        ClassEntity classEntity = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        CourseCategory category = classEntity.getCategory();
        List<Course> courses = classEntity.getCourses().stream().toList();
        
        java.util.Map<String, Object> debugInfo = new java.util.HashMap<>();
        debugInfo.put("studentId", studentId);
        debugInfo.put("classId", classId);
        debugInfo.put("categoryName", category.getName());
        debugInfo.put("totalCoursesInClass", courses.size());
        
        // Kiểm tra CategoryGrade status
        boolean categoryPassed = categoryGradeService.isCategoryPassed(studentId, classId);
        debugInfo.put("categoryPassed", categoryPassed);
        
        // Kiểm tra xem đã có certificate chưa
        boolean hasCertificate = certificateService.getCertificate(
            userRepo.findById(studentId).orElse(null), 
            classEntity, 
            category) != null;
        debugInfo.put("hasCertificate", hasCertificate);
        
        return debugInfo;
    }

    // ✅ FORCE ISSUE CERTIFICATE (CHỈ DÀNH CHO DEBUG)
    public java.util.Map<String, Object> forceIssueCertificate(Integer studentId, String classIdStr) {
        Integer classId = parseClassId(classIdStr);
        log.warn("FORCE ISSUE CERTIFICATE được gọi cho Student: {}, Class: {}", studentId, classId);
        
        ClassEntity classEntity = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        CourseCategory category = classEntity.getCategory();
        
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        
        try {
            // Bỏ qua tất cả kiểm tra, cấp chứng chỉ luôn
            certificateService.createCertificate(
                    userRepo.findById(studentId)
                            .orElseThrow(() -> new RuntimeException("Student not found")),
                    classEntity,
                    category
            );
            
            result.put("success", true);
            result.put("message", "Đã force cấp chứng chỉ thành công!");
            result.put("studentId", studentId);
            result.put("classId", classId);
            result.put("categoryName", category.getName());
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }

    // ✅ KIỂM TRA ĐIỂM TẤT CẢ MÔN HỌC
    public java.util.Map<String, Object> checkAllCourseGrades(Integer studentId, String classIdStr) {
        Integer classId = parseClassId(classIdStr);
        ClassEntity classEntity = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        
        CourseCategory category = classEntity.getCategory();
        List<Course> courses = classEntity.getCourses().stream().toList();
        
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("studentId", studentId);
        result.put("classId", classId);
        result.put("categoryName", category.getName());
        
        java.util.List<java.util.Map<String, Object>> courseDetails = new java.util.ArrayList<>();
        
        for (Course course : courses) {
            java.util.Map<String, Object> courseInfo = new java.util.HashMap<>();
            courseInfo.put("courseId", course.getCourseId());
            courseInfo.put("courseTitle", course.getTitle());
            
            // Tính điểm course này
            try {
                courseGradeService.calculateCourseGrade(studentId, classId, course.getCourseId());
                courseInfo.put("gradeCalculated", true);
            } catch (Exception e) {
                courseInfo.put("gradeCalculated", false);
                courseInfo.put("error", e.getMessage());
            }
            
            courseDetails.add(courseInfo);
        }
        
        result.put("courses", courseDetails);
        
        // Tính lại CategoryGrade
        try {
            categoryGradeService.calculateCategoryGrade(studentId, classId);
            boolean categoryPassed = categoryGradeService.isCategoryPassed(studentId, classId);
            result.put("categoryGradeCalculated", true);
            result.put("categoryPassed", categoryPassed);
        } catch (Exception e) {
            result.put("categoryGradeCalculated", false);
            result.put("categoryError", e.getMessage());
        }
        
        return result;
    }

    // ✅ RECALCULATE ALL VÀ ISSUE CERTIFICATE
    public Map<String, Object> recalculateAndIssueCertificate(Integer studentId, String classIdStr) {
        Integer classId = parseClassId(classIdStr);
        log.info("Bắt đầu tính lại toàn bộ điểm và cấp chứng chỉ cho Student: {}, Class: {}", studentId, classId);
        
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        
        try {
            // 1. Tính lại tất cả điểm
            java.util.Map<String, Object> gradeResult = checkAllCourseGrades(studentId, classIdStr);
            result.put("gradeCalculationResult", gradeResult);
            
            // 2. Kiểm tra điều kiện cấp chứng chỉ
            boolean categoryPassed = (Boolean) gradeResult.getOrDefault("categoryPassed", false);
            result.put("categoryPassed", categoryPassed);
            
            if (categoryPassed) {
                // 3. Cấp chứng chỉ
                ClassEntity classEntity = classRepo.findById(classId)
                        .orElseThrow(() -> new RuntimeException("Class not found"));
                CourseCategory category = classEntity.getCategory();
                
                var certificate = certificateService.createCertificate(
                        userRepo.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found")),
                        classEntity,
                        category
                );
                
                if (certificate != null) {
                    result.put("certificateIssued", true);
                    result.put("certificateCode", certificate.getCertificateCode());
                    result.put("message", "🎉 Chứng chỉ đã được cấp thành công!");
                } else {
                    result.put("certificateIssued", false);
                    result.put("message", "⚠️ Chứng chỉ có thể đã tồn tại hoặc có lỗi khi tạo");
                }
            } else {
                result.put("certificateIssued", false);
                result.put("message", "❌ Chưa đủ điều kiện cấp chứng chỉ (CategoryGrade chưa PASS)");
            }
            
            result.put("success", true);
            
        } catch (Exception e) {
            log.error("Lỗi khi recalculate và issue certificate: {}", e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Helper method để convert classId từ String sang Integer
     * Hỗ trợ cả class code (VD: MKT202) và class ID number
     */
    private Integer parseClassId(String classIdStr) {
        try {
            // Thử parse trực tiếp nếu là số
            return Integer.parseInt(classIdStr);
        } catch (NumberFormatException e) {
            // Nếu không phải số, tìm class theo className
            ClassEntity classEntity = classRepo.findByClassName(classIdStr)
                .orElseThrow(() -> new EntityNotFoundException("Class not found with code: " + classIdStr));
            return classEntity.getClassId();
        }
    }
}
