package com.ra.base_spring_boot.dto;

import com.ra.base_spring_boot.model.CourseGrade;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseGradeDTO {

    private Integer id;
    private Integer studentId;
    private String studentName;

    private Integer classId;
    private String className;

    private Integer courseId;
    private String courseName;

    private Double assignmentScore;
    private Double quizScore;
    private Double examScore;
    private Double finalScore;

    private String status;

    public CourseGradeDTO(CourseGrade cg) {
        this.id = cg.getCourseGradeId();

        if (cg.getStudent() != null) {
            this.studentId = cg.getStudent().getId();
            this.studentName = cg.getStudent().getFullName();
        }

        if (cg.getClassEntity() != null) {
            this.classId = cg.getClassEntity().getClassId();
            this.className = cg.getClassEntity().getClassName();
        }

        if (cg.getCourse() != null) {
            this.courseId = cg.getCourse().getCourseId();
            this.courseName = cg.getCourse().getTitle();
        }

        this.assignmentScore = cg.getAssignmentScore();
        this.quizScore = cg.getQuizScore();
        this.examScore = cg.getExamScore();
        this.finalScore = cg.getFinalScore();

        this.status = cg.getStatus() != null ? cg.getStatus().name() : null;
    }
}
