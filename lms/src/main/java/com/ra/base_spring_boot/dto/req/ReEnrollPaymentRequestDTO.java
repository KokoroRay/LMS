// ReEnrollPaymentRequestDTO.java
package com.ra.base_spring_boot.dto.req;

import com.ra.base_spring_boot.model.constants.PaymentMethod;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReEnrollPaymentRequestDTO {

    private List<Integer> reEnrollmentIds;   // Danh sách ID các lần học lại
    private PaymentMethod paymentMethod;     // VNPAY, OFFLINE, MOMO,..
}
