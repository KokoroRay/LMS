package com.ra.base_spring_boot.mapper;

import com.ra.base_spring_boot.dto.req.StudentRequestDTO;
import com.ra.base_spring_boot.dto.resp.StudentResponseDTO;
import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.UserProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface StudentMapper {

    StudentMapper INSTANCE = Mappers.getMapper(StudentMapper.class);

    // ------------------ ENTITY -> DTO ------------------
    @Mapping(source = "id", target = "userId")
    @Mapping(source = "username", target = "username")
    @Mapping(source = "email", target = "email")
    @Mapping(source = "firstName", target = "firstName")
    @Mapping(source = "lastName", target = "lastName")
    @Mapping(source = "phone", target = "phone")
    @Mapping(source = "dateOfBirth", target = "dateOfBirth")
    @Mapping(source = "gender", target = "gender")
    @Mapping(source = "avatarUrl", target = "avatarUrl")
    @Mapping(source = "status", target = "status")
    @Mapping(source = "profile", target = "studentCode", qualifiedByName = "profileToStudentCode")
    @Mapping(source = "profile", target = "className", qualifiedByName = "profileToClassName")
    @Mapping(source = "profile", target = "address", qualifiedByName = "profileToAddress")
    @Mapping(source = "profile", target = "city", qualifiedByName = "profileToCity")
    @Mapping(source = "profile", target = "country", qualifiedByName = "profileToCountry")
    @Mapping(source = "profile", target = "occupation", qualifiedByName = "profileToOccupation")
    @Mapping(source = "profile", target = "bio", qualifiedByName = "profileToBio")
    @Mapping(source = "createdAt", target = "createdAt")
    @Mapping(source = "updatedAt", target = "updatedAt")
    StudentResponseDTO userToStudentResponseDTO(User user);

    // ------------------ DTO -> ENTITY ------------------
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "profile", ignore = true) // profile set riêng ở service
    User studentRequestDTOToUser(StudentRequestDTO dto);

    // ------------------ Update ENTITY ------------------
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "profile", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateUserFromDTO(StudentRequestDTO dto, @MappingTarget User user);

    // ------------------ PROFILE MAPPERS ------------------
    @Named("profileToStudentCode")
    default String profileToStudentCode(UserProfile profile) {
        return profile != null ? profile.getStudentCode() : null;
    }

    @Named("profileToClassName")
    default String profileToClassName(UserProfile profile) {
        return profile != null ? profile.getClassName() : null;
    }

    @Named("profileToAddress")
    default String profileToAddress(UserProfile profile) {
        return profile != null ? profile.getAddress() : null;
    }

    @Named("profileToCity")
    default String profileToCity(UserProfile profile) {
        return profile != null ? profile.getCity() : null;
    }

    @Named("profileToCountry")
    default String profileToCountry(UserProfile profile) {
        return profile != null ? profile.getCountry() : null;
    }

    @Named("profileToOccupation")
    default String profileToOccupation(UserProfile profile) {
        return profile != null ? profile.getOccupation() : null;
    }

    @Named("profileToBio")
    default String profileToBio(UserProfile profile) {
        return profile != null ? profile.getBio() : null;
    }
}
