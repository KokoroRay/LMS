package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.req.SessionRequestDTO;
import com.ra.base_spring_boot.dto.resp.SessionDTO;
import com.ra.base_spring_boot.model.Course;
import com.ra.base_spring_boot.model.Session;
import com.ra.base_spring_boot.repository.CourseRepository;
import com.ra.base_spring_boot.repository.SessionRepository;
import com.ra.base_spring_boot.services.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/* ====== Thêm các import cho repo con ====== */
import com.ra.base_spring_boot.repository.AssignmentRepository;
import com.ra.base_spring_boot.repository.LessonRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final CourseRepository courseRepository;

    /* ====== Repo con để xoá trước khi xoá session ====== */
    private final AssignmentRepository assignmentRepository;
    private final LessonRepository lessonRepository;

    /** Lấy tất cả session. */
    @Override
    public List<SessionDTO> findAll() {
        return sessionRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /** Tìm session theo ID. */
    @Override
    public SessionDTO findById(Integer id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found with id: " + id));
        return toDto(session);
    }

    /** Thêm mới một session — tự động gán position và kiểm tra trùng lặp. */
    @Override
    @Transactional
    public SessionDTO save(SessionRequestDTO dto) {
        if (dto.getCourseId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "courseId is required");
        }
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course not found"));

        String title = dto.getTitle() == null ? "" : dto.getTitle().trim();
        if (title.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required");
        }

        int maxPosition = sessionRepository.findMaxPositionByCourseId(course.getCourseId()).orElse(0);
        int position = (dto.getPosition() != null) ? dto.getPosition() : (maxPosition + 1);
        if (position < 1) position = 1;

        boolean positionExists = sessionRepository
                .existsByCourse_CourseIdAndPosition(course.getCourseId(), position);
        if (positionExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Position " + position + " already exists in this course.");
        }

        Session session = Session.builder()
                .title(title)
                .course(course)
                .position(position)
                .build();

        Session saved = sessionRepository.save(session);
        log.info("Created session '{}' at position {} for course '{}'",
                saved.getTitle(), position, course.getTitle());

        return toDto(saved);
    }

    /** Cập nhật session. */
    @Override
    @Transactional
    public SessionDTO update(Integer id, SessionRequestDTO dto) {
        Session existing = sessionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        Course newCourse = existing.getCourse();
        if (dto.getCourseId() != null && !Objects.equals(dto.getCourseId(), existing.getCourse().getCourseId())) {
            newCourse = courseRepository.findById(dto.getCourseId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course not found"));
            existing.setCourse(newCourse);
        }

        if (dto.getTitle() != null) {
            String title = dto.getTitle().trim();
            if (title.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title cannot be empty");
            }
            existing.setTitle(title);
        }

        if (dto.getPosition() != null) {
            int newPos = dto.getPosition();
            if (newPos < 1) newPos = 1;

            boolean courseChanged = !Objects.equals(newCourse.getCourseId(), existing.getCourse().getCourseId());
            boolean positionChanged = !Objects.equals(newPos, existing.getPosition());

            if (courseChanged || positionChanged) {
                boolean positionExists = sessionRepository
                        .existsByCourse_CourseIdAndPosition(newCourse.getCourseId(), newPos);
                if (positionExists) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Position " + newPos + " already exists in this course.");
                }
                existing.setPosition(newPos);
            }
        }

        Session updated = sessionRepository.save(existing);
        log.info("Updated session id={} -> title='{}', courseId={}, position={}",
                id, updated.getTitle(), updated.getCourse().getCourseId(), updated.getPosition());
        return toDto(updated);
    }

    /** Xóa session theo ID (xoá con trước để tránh lỗi FK). */
    @Override
    @Transactional
    public void delete(Integer id) {
        Session s = sessionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found with id: " + id));

        // 1) Xoá tất cả Assignment thuộc session này
        // (nếu có submissions/grades FK -> assignment, bạn cần cascade ở DB hoặc xoá thêm ở repo tương ứng)
        int delAssign = assignmentRepository.deleteAllBySessionId(id);

        // 2) Xoá tất cả Lesson thuộc session này (nếu lessons có FK -> session)
        int delLesson = lessonRepository.deleteAllBySessionId(id);

        // 3) Xoá session
        sessionRepository.delete(s);

        log.info("Deleted session id={} (removed {} assignments, {} lessons)", id, delAssign, delLesson);
    }

    /** Lấy danh sách session theo courseId (sắp xếp theo position). */
    @Override
    public List<SessionDTO> findByCourseId(Integer courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course not found"));

        List<Session> list = sessionRepository.findByCourse_CourseIdOrderByPositionAsc(course.getCourseId());
        list.sort(Comparator.comparing(s -> s.getPosition() == null ? 0 : s.getPosition()));

        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    /** Mapping entity → DTO. */
    private SessionDTO toDto(Session entity) {
        return SessionDTO.builder()
                .sessionId(entity.getSessionId())
                .title(entity.getTitle() != null ? entity.getTitle() : entity.getName())
                .courseId(entity.getCourse().getCourseId())
                .position(entity.getPosition() != null ? entity.getPosition() : 0)
                .build();
    }
}
