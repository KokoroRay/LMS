// PaymentResponseDTO.java
package com.ra.base_spring_boot.dto.resp;

import com.ra.base_spring_boot.model.constants.PaymentMethod;
import com.ra.base_spring_boot.model.constants.PaymentStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponseDTO {
    private Integer paymentId;
    private Integer categoryId;  // thay cho courseId
    private Integer classId;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private LocalDateTime createdAt;
    private String paymentUrl;
    private UserDTO student;
}
