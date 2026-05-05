package com.ra.base_spring_boot.controller;

import com.ra.base_spring_boot.dto.CourseGradeDTO;
import com.ra.base_spring_boot.model.CourseGrade;
import com.ra.base_spring_boot.services.CourseGradeService;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.RoleName;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/grades")
@RequiredArgsConstructor
public class CourseGradeController {

    private final CourseGradeService courseGradeService;

    @GetMapping("/student/{studentId}")
    public List<CourseGradeDTO> getStudentGrades(@PathVariable Integer studentId) {
        return courseGradeService.getGradesByStudent(studentId);
    }

    @GetMapping("/class/{classId}")
    public List<CourseGradeDTO> getClassGrades(@PathVariable Integer classId) {
        return courseGradeService.getGradesByClass(classId);
    }

    /**
     * ⭐ ENDPOINT MỚI: Cập nhật điểm exam cho sinh viên học lại
     * Chỉ được phép cập nhật khi sinh viên đã đóng tiền học lại thành công
     */
    @PutMapping("/reenrollment/update-exam-score")
    public ResponseEntity<?> updateExamScoreForReEnrollment(
            @RequestParam Integer studentId,
            @RequestParam Integer classId,
            @RequestParam Integer courseId,
            @RequestParam Double examScore,
            @AuthenticationPrincipal MyUserDetails userDetails) {
        
        // Kiểm tra authentication
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Chưa đăng nhập"));
        }

        User currentUser = userDetails.getUser();
        // Chỉ admin mới có quyền cập nhật điểm
        if (!RoleName.ROLE_ADMIN.equals(currentUser.getRole().getRoleName())) {
            return ResponseEntity.status(403).body(Map.of("error", "Chỉ admin mới có quyền cập nhật điểm exam"));
        }
        
        try {
            if (examScore == null || examScore < 0 || examScore > 10) {
                return ResponseEntity.badRequest().body(Map.of("error", "Điểm exam phải trong khoảng 0-10"));
            }

            CourseGrade updatedGrade = courseGradeService.updateExamScoreForReEnrollment(studentId, classId, courseId, examScore);
            
            return ResponseEntity.ok(Map.of(
                "message", "Cập nhật điểm exam thành công",
                "data", new CourseGradeDTO(updatedGrade)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}