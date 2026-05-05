package com.ra.base_spring_boot.dto.resp;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionDTO {
    private Integer sessionId;
    private String title;
    private Integer courseId;
    private Integer position;
}
