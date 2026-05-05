package com.ra.base_spring_boot.mapper;

import com.ra.base_spring_boot.dto.resp.ForumPostResponseDTO;
import com.ra.base_spring_boot.dto.resp.ForumReportResponseDTO;
import com.ra.base_spring_boot.dto.resp.ForumTopicResponseDTO;
import com.ra.base_spring_boot.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "userId", source = "id")
    @Mapping(target = "firstName", source = "firstName")
    @Mapping(target = "lastName", source = "lastName")
    @Mapping(target = "email", source = "email")
    @Mapping(target = "avatarUrl", source = "avatarUrl")
    ForumTopicResponseDTO.UserInfo toTopicUserInfo(User user);

    @Mapping(target = "userId", source = "id")
    @Mapping(target = "firstName", source = "firstName")
    @Mapping(target = "lastName", source = "lastName")
    @Mapping(target = "email", source = "email")
    @Mapping(target = "avatarUrl", source = "avatarUrl")
    ForumPostResponseDTO.UserInfo toPostUserInfo(User user);

    @Named("toReportUserInfo")
    @Mapping(target = "userId", source = "id")
    @Mapping(target = "firstName", source = "firstName")
    @Mapping(target = "lastName", source = "lastName")
    @Mapping(target = "email", source = "email")
    @Mapping(target = "avatarUrl", source = "avatarUrl")
    ForumReportResponseDTO.UserInfo toReportUserInfo(User user);
}
