package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.dto.resp.CourseDTO;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.CourseStatus;

import java.util.List;
import java.util.Optional;

public interface CourseService
{
    List<CourseDTO> getAllCourses();


    Optional<CourseDTO> getCourseById(Integer id);


    CourseDTO createCourse(CourseDTO courseDTO);


    Optional<CourseDTO> updateCourse(Integer id, CourseDTO courseDTO);


    boolean deleteCourse(Integer id);


    CourseDTO updateCourseStatus(Integer id, CourseStatus status);

    List<CourseDTO> getPublishedCourses(String title);

    List<CourseDTO> getCoursesByCategoryId(Integer categoryId);

    List<CourseDTO> getArchivedCourses();

    List<User> getFailedStudentsForCourse(Integer courseId);

    List<User> getInstructorsByCourseId(Integer courseId);

    List<CourseDTO> getCoursesByTeacherId(Integer teacherId);



        boolean isStudentEnrolled(Integer studentId, Integer courseId);



        List<CourseDTO> getEnrolledCoursesByStudentId(Integer studentId);

    }
