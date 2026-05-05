
package com.ra.base_spring_boot.events;

import org.springframework.context.ApplicationEvent;

public class GradeUpdatedEvent extends ApplicationEvent {

    private final Integer studentId;
    private final Integer classId;
    private final Integer courseId;

    public GradeUpdatedEvent(Object source, Integer studentId, Integer classId, Integer courseId) {
        super(source);
        this.studentId = studentId;
        this.classId = classId;
        this.courseId = courseId;
    }

    public Integer getStudentId() { return studentId; }
    public Integer getClassId() { return classId; }
    public Integer getCourseId() { return courseId; }
}