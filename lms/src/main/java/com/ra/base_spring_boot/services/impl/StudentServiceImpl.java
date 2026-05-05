package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.dto.req.StudentRequestDTO;
import com.ra.base_spring_boot.dto.resp.StudentResponseDTO;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.mapper.StudentMapper;
import com.ra.base_spring_boot.model.Role;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.UserProfile;
import com.ra.base_spring_boot.model.constants.EnrollmentStatus;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.model.constants.UserStatus;
import com.ra.base_spring_boot.repository.EnrollmentRepository;
import com.ra.base_spring_boot.repository.IRoleRepository;
import com.ra.base_spring_boot.repository.IUserRepository;
import com.ra.base_spring_boot.services.IStudentService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;


@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements IStudentService {

    private final IUserRepository userRepository;
    private final IRoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentMapper studentMapper;
    private final EnrollmentRepository enrollmentRepository; // ĐÃ INJECT

    /**
     * Helper: Lấy tên lớp ACTIVE hiện tại của sinh viên từ Enrollment.
     * Ưu tiên Enrollment mới nhất (dựa trên enrolledAt DESC)
     */
    private String getCurrentClassNameFromEnrollment(Integer userId) {
        // Lấy danh sách Enrollment đang ACTIVE, sắp xếp theo enrolledAt DESC
        List<com.ra.base_spring_boot.model.Enrollment> activeEnrollments = enrollmentRepository.findActiveEnrollmentsByStudentId(userId);

        if (activeEnrollments != null && !activeEnrollments.isEmpty()) {
            // Lấy Enrollment mới nhất (phần tử đầu tiên)
            com.ra.base_spring_boot.model.Enrollment latestEnrollment = activeEnrollments.get(0);

            // Lấy tên lớp từ ClassEntity
            if (latestEnrollment.getClassEntity() != null) {
                return latestEnrollment.getClassEntity().getClassName();
                // CHÚ Ý: Đảm bảo ClassEntity có getter getClassName()
            }
        }
        return null;
    }

    /**
     * Helper: Map User Entity sang StudentResponseDTO và bổ sung ClassName từ Enrollment
     */
    private StudentResponseDTO mapUserToStudentResponseDTO(User user) {
        StudentResponseDTO dto = studentMapper.userToStudentResponseDTO(user);

        // Ghi đè className bằng thông tin Enrollment (nếu có)
        String classNameFromEnrollment = getCurrentClassNameFromEnrollment(user.getId());
        if (classNameFromEnrollment != null) {
            dto.setClassName(classNameFromEnrollment);
        } else {
            // Nếu không có Enrollment ACTIVE, giữ lại className từ UserProfile (cho mục đích Import/View)
            dto.setClassName(user.getProfile() != null ? user.getProfile().getClassName() : null);
        }

        return dto;
    }

    @Override
    public Page<StudentResponseDTO> findAll(Pageable pageable, String keyword, Boolean excludeStudentsInOtherActiveClasses) {
        Role studentRole = roleRepository.findByRoleName(RoleName.ROLE_USER)
                .orElseThrow(() -> new HttpNotFound("Role not found"));

        Page<User> users;
        
        if (excludeStudentsInOtherActiveClasses != null && excludeStudentsInOtherActiveClasses) {
            // Find students who are NOT actively enrolled in any class
            // This requires a custom query in UserRepository or a more complex join.
            // For simplicity, let's get all student users first and then filter.
            // A more efficient way would be a custom repository method that does a LEFT JOIN and filters.
            List<User> allStudentUsers = (keyword != null && !keyword.trim().isEmpty())
                                        ? userRepository.findByRoleAndKeyword(studentRole.getId(), keyword, Pageable.unpaged()).getContent()
                                        : userRepository.findByRoleId(studentRole.getId(), Pageable.unpaged()).getContent();
            
            List<User> filteredUsers = new ArrayList<>();
            for (User user : allStudentUsers) {
                // Check if the student has any active enrollments
                boolean isActiveInAnyClass = enrollmentRepository.existsByStudentAndStatus(user, EnrollmentStatus.ACTIVE);
                if (!isActiveInAnyClass) {
                    filteredUsers.add(user);
                }
            }
            
            // Manually paginate the filtered list
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), filteredUsers.size());
            List<User> pagedUsers = filteredUsers.subList(start, end);
            users = new org.springframework.data.domain.PageImpl<>(pagedUsers, pageable, filteredUsers.size());

        } else if(keyword != null && !keyword.trim().isEmpty()) {
            users = userRepository.findByRoleAndKeyword(studentRole.getId(), keyword, pageable);
        } else {
            users = userRepository.findByRoleId(studentRole.getId(), pageable);
        }

        // DÙNG HÀM HELPER ĐÃ SỬA
        return users.map(this::mapUserToStudentResponseDTO);
    }

    @Override
    public StudentResponseDTO findById(Integer id) {
        User user = userRepository.findById(id).orElseThrow(() -> new HttpNotFound("Student not found" + id));
        Role studentRole = roleRepository.findByRoleName(RoleName.ROLE_USER)
                .orElseThrow(() -> new HttpNotFound("Role not found"));
        if (!user.getRole().equals(studentRole)) {
            throw new HttpNotFound("Student not found" + id);
        }

        // DÙNG HÀM HELPER ĐÃ SỬA
        return mapUserToStudentResponseDTO(user);
    }

    @Override
    @Transactional
    public StudentResponseDTO create(StudentRequestDTO studentRequestDTO) {
        // --- Logic check email/student code ---
        if (userRepository.existsByEmail(studentRequestDTO.getEmail())) {
            throw new HttpNotFound("Email already exists");
        }
        if (studentRequestDTO.getStudentCode() != null
                && !studentRequestDTO.getStudentCode().trim().isEmpty()
                && userRepository.existsByStudentCode(studentRequestDTO.getStudentCode())) {
            throw new HttpNotFound("Student code already exists");
        }

        // --- Map và set Role/Password/Status ---
        User user = studentMapper.studentRequestDTOToUser(studentRequestDTO);
        user.setPasswordHash(passwordEncoder.encode("123456"));
        user.setStatus(UserStatus.ACTIVE);
        user.setFirstLogin(true);
        Role studentRole = roleRepository.findByRoleName(RoleName.ROLE_USER)
                .orElseThrow(() -> new HttpNotFound("Student role not found"));
        user.setRole(studentRole);
        user.setAvatarUrl(studentRequestDTO.getAvatarUrl());

        // --- Tạo hoặc cập nhật UserProfile ---
        UserProfile userProfile = new UserProfile();
        userProfile.setUser(user);
        userProfile.setStudentCode(studentRequestDTO.getStudentCode());
        userProfile.setClassName(studentRequestDTO.getClassName());
        userProfile.setAddress(studentRequestDTO.getAddress());
        userProfile.setCity(studentRequestDTO.getCity());
        userProfile.setCountry(studentRequestDTO.getCountry());
        userProfile.setOccupation(studentRequestDTO.getOccupation());
        userProfile.setBio(studentRequestDTO.getBio());

        user.setProfile(userProfile);

        // --- Lưu và trả về DTO ---
        User savedUser = userRepository.save(user);

        // DÙNG HÀM HELPER ĐÃ SỬA
        return mapUserToStudentResponseDTO(savedUser);
    }


    @Override
    @Transactional
    public StudentResponseDTO update(Integer id, StudentRequestDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new HttpNotFound("Student not found " + id));

        // ... (Logic kiểm tra email/code/password)

        // MapStruct sẽ chỉ cập nhật các field != null
        studentMapper.updateUserFromDTO(dto, user);
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }
        if (dto.getStatus() != null) {
            user.setStatus(dto.getStatus());
        }

        // Profile
        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
        }

        // Update studentCode in Profile
        if (dto.getStudentCode() != null) { // If studentCode was explicitly sent (not undefined/null from frontend)
            String trimmedStudentCode = dto.getStudentCode().trim();
            profile.setStudentCode(trimmedStudentCode.isEmpty() ? null : trimmedStudentCode);
        } else { // If dto.getStudentCode() is null (frontend sent undefined for an empty field)
            profile.setStudentCode(null); // Assume empty input means clearing the field
        }

        // Update className in Profile
        if (dto.getClassName() != null) { // If className was explicitly sent (frontend sends "" for empty)
            String trimmedClassName = dto.getClassName().trim();
            profile.setClassName(trimmedClassName.isEmpty() ? null : trimmedClassName);
        } else { // If dto.getClassName() is null (frontend didn't send it, e.g., if editingId is false or field was explicitly removed from payload)
            // Do nothing, keep existing className, or set to null if that's the desired default for "not sent"
            // Given frontend always sends className if editingId is true, this 'else' implies it wasn't meant to be updated.
            // For robustness, let's assume if it's not sent, it should be null if not already present.
            if (profile.getClassName() != null) { // Only set to null if it already had a value
                profile.setClassName(null);
            }
        }

        user.setProfile(profile);

        User saved = userRepository.save(user);

        // DÙNG HÀM HELPER ĐÃ SỬA
        return mapUserToStudentResponseDTO(saved);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new HttpNotFound("Student not found " + id));

        // HARD DELETE: không cập nhật status
        userRepository.delete(user);
    }


    @Override
    @Transactional
    public void importFromExcel(MultipartFile file) throws Exception {
        if(file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (!file.getOriginalFilename().endsWith(".xlsx")) {
            throw new IllegalArgumentException("File must be .xlsx");
        }
        List<StudentRequestDTO> students = new ArrayList<>();
        try (InputStream inputStream = file.getInputStream(); Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();

            if(rowIterator.hasNext()) {
                rowIterator.next();
            }
            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                StudentRequestDTO student = new StudentRequestDTO();
                student.setEmail(getCellStringValue(row.getCell(0)));
                student.setPassword(getCellStringValue(row.getCell(1)));
                student.setFirstName(getCellStringValue(row.getCell(2)));
                student.setLastName(getCellStringValue(row.getCell(3)));
                student.setPhone(getCellStringValue(row.getCell(4)));
                student.setStudentCode(getCellStringValue(row.getCell(5)));
                student.setClassName(getCellStringValue(row.getCell(6)));

                if(student.getPassword() == null || student.getPassword().trim().isEmpty()) {
                    student.setPassword("123@123");
                }
                students.add(student);
            }
        }

        for (StudentRequestDTO studentRequestDTO : students) {
            try {
                this.create(studentRequestDTO);
            } catch (Exception e) {
                System.err.println("Error importing student: " + studentRequestDTO.getEmail() + " " + e.getMessage());
            }
        }
    }

    @Override
    public Boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByStudentCode(String studentCode) {
        return userRepository.existsByStudentCode(studentCode) ;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) {
            return null;
        }
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if(DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    return String.valueOf(cell.getNumericCellValue());
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return null;
        }
    }
}