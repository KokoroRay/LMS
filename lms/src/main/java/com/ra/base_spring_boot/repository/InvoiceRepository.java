package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.Invoice;
import com.ra.base_spring_boot.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {

    Optional<Invoice> findByPayment(Payment payment);
}
