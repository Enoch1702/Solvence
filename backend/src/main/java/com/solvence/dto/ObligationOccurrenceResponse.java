package com.solvence.dto;

import com.solvence.entity.ObligationOccurrence;
import com.solvence.entity.OccurrenceStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ObligationOccurrenceResponse(
        Long id,
        Long recurringObligationId,
        String obligationName,
        LocalDate cycleStartDate,
        LocalDate cycleEndDate,
        LocalDate dueDate,
        BigDecimal amount,
        OccurrenceStatus status,
        Long transactionId,
        Instant paidAt,
        Instant createdAt
) {
    public static ObligationOccurrenceResponse fromEntity(ObligationOccurrence entity) {
        return new ObligationOccurrenceResponse(
                entity.getId(),
                entity.getRecurringObligation() != null ? entity.getRecurringObligation().getId() : null,
                entity.getRecurringObligation() != null ? entity.getRecurringObligation().getName() : null,
                entity.getCycleStartDate(),
                entity.getCycleEndDate(),
                entity.getDueDate(),
                entity.getAmount(),
                entity.getStatus(),
                entity.getTransaction() != null ? entity.getTransaction().getId() : null,
                entity.getPaidAt(),
                entity.getCreatedAt()
        );
    }
}
