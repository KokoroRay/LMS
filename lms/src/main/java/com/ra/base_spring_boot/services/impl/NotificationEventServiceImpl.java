package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.model.Assignment;
import com.ra.base_spring_boot.model.Exam;
import com.ra.base_spring_boot.model.ExamSlot; // Import thêm cái này
import com.ra.base_spring_boot.model.Notification;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.repository.AssignmentRepository;
import com.ra.base_spring_boot.repository.ClassCourseTeacherAssignmentRepository;
import com.ra.base_spring_boot.repository.ExamRepository;
import com.ra.base_spring_boot.repository.UserRepository;
import com.ra.base_spring_boot.services.NotificationEventService;
import com.ra.base_spring_boot.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Comparator; // Import thêm

@Service
@RequiredArgsConstructor
public class NotificationEventServiceImpl implements NotificationEventService {

    private final NotificationService notificationService;
    private final AssignmentRepository assignmentRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final ClassCourseTeacherAssignmentRepository classCourseTeacherAssignmentRepository;

    @Scheduled(cron = "0 0 9 * * *")
    @Override
    public void sendUpcomingDeadlineNotifications() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1);

        List<Assignment> upcomingAssignments = assignmentRepository.findByDueDateBetween(now, tomorrow);

        for (Assignment assignment : upcomingAssignments) {
            Integer courseId = assignment.getCourse().getCourseId();
            List<Integer> classIds = classCourseTeacherAssignmentRepository.findClassIdsByCourseId(courseId);

            for (Integer classId : classIds) {
                List<User> students = userRepository.findStudentsByClassId(classId);
                String title = "Nhắc nhở deadline bài tập";
                String message = String.format("Bài tập '%s' sẽ hết hạn vào %s",
                        assignment.getTitle(), assignment.getDueDate());

                for (User student : students) {
                    try {
                        Notification notification = notificationService.createNotification(
                                student.getId(), title, message);
                        notificationService.sendNotificationToUser(student.getId(), notification);
                    } catch (Exception e) {
                        System.err.println("Failed to send deadline notification to student " + student.getId());
                    }
                }
            }
        }
    }

    /**
     * Chạy mỗi ngày lúc 8:00 AM để kiểm tra exam sắp diễn ra
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Override
    public void sendUpcomingExamNotifications() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1);

        // SỬA 1: Gọi hàm query mới (findUpcomingExams) thay vì hàm cũ
        List<Exam> upcomingExams = examRepository.findUpcomingExams(now, tomorrow);

        for (Exam exam : upcomingExams) {
            List<User> students = userRepository.findStudentsByClassId(
                    exam.getClassEntity().getClassId());

            // SỬA 2: Lấy thời gian bắt đầu sớm nhất từ danh sách Slot
            LocalDateTime earliestSlotTime = exam.getExamSlots().stream()
                    .map(ExamSlot::getSlotTime)
                    .min(LocalDateTime::compareTo)
                    .orElse(null);

            // Nếu không có slot nào (dữ liệu lỗi), bỏ qua
            if (earliestSlotTime == null) continue;

            String title = "Nhắc nhở kỳ thi sắp diễn ra";
            // SỬA 3: Sử dụng biến earliestSlotTime thay vì exam.getStartTime()
            String message = String.format("Kỳ thi '%s' sẽ bắt đầu vào ca sớm nhất lúc %s",
                    exam.getTitle(), earliestSlotTime);

            for (User student : students) {
                try {
                    Notification notification = notificationService.createNotification(
                            student.getId(), title, message);
                    notificationService.sendNotificationToUser(student.getId(), notification);
                } catch (Exception e) {
                    System.err.println("Failed to send exam notification to student " + student.getId());
                }
            }
        }
    }

    @Override
    public void notifyAllStudentsInClass(Integer classId, String title, String message) {
        List<User> students = userRepository.findStudentsByClassId(classId);

        for (User student : students) {
            try {
                Notification notification = notificationService.createNotification(
                        student.getId(), title, message);
                notificationService.sendNotificationToUser(student.getId(), notification);
            } catch (Exception e) {
                System.err.println("Failed to send notification to student " + student.getId());
            }
        }
    }

    @Override
    public void notifyUsers(List<Integer> userIds, String title, String message) {
        for (Integer userId : userIds) {
            try {
                Notification notification = notificationService.createNotification(
                        userId, title, message);
                notificationService.sendNotificationToUser(userId, notification);
            } catch (Exception e) {
                System.err.println("Failed to send notification to user " + userId);
            }
        }
    }
}