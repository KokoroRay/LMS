package com.ra.base_spring_boot.mapper;

import com.ra.base_spring_boot.dto.ExamSlotDTO;
import com.ra.base_spring_boot.dto.req.ExamSlotRequestDTO;
import com.ra.base_spring_boot.model.ExamSlot;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ExamSlotMapper {
    ExamSlotDTO toDTO(ExamSlot examSlot);

    List<ExamSlotDTO> toDTOList(List<ExamSlot> examSlots);

    @Mapping(target = "slotId", ignore = true)
    @Mapping(target = "exam", ignore = true)
    @Mapping(target = "currentParticipants", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    ExamSlot toEntity(ExamSlotRequestDTO examSlotRequestDTO);

    @Mapping(target = "slotId", ignore = true)
    @Mapping(target = "exam", ignore = true)
    @Mapping(target = "currentParticipants", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    List<ExamSlot> toEntityList(List<ExamSlotRequestDTO> examSlotRequestDTOs);
}
