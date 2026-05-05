// PaymentRequestDTO.java
package com.ra.base_spring_boot.dto.req;

import com.ra.base_spring_boot.model.constants.PaymentMethod;
import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequestDTO {
    private Integer categoryId;       // ID khóa học
    private Integer classId;          // Lớp đã chọn (nếu có)
    private PaymentMethod paymentMethod; // Phương thức thanh toán
}

