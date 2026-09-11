package com.solvence.dto;

import com.solvence.entity.ObligationFrequency;
import com.solvence.entity.OccurrenceStatus;
import com.solvence.entity.RecurringObligation;

import java.math.BigDecimal;
import java.time.Instant;

public record ObligationResponse(
        Long id,
        String name,
        BigDecimal amount,
        Integer dueDay,
        ObligationFrequency frequency,
        boolean isActive,
        Long categoryId,
        String categoryName,
        String notes,
        Instant createdAt,
        OccurrenceStatus currentCycleStatus,
        Long currentCycleOccurrenceId
) {
    public static ObligationResponse fromEntity(RecurringObligation entity) {
        return fromEntity(entity, null, null);
    }

    public static ObligationResponse fromEntity(RecurringObligation entity, OccurrenceStatus currentCycleStatus, Long currentCycleOccurrenceId) {
        return new ObligationResponse(
                entity.getId(),
                entity.getName(),
                entity.getAmount(),
                entity.getDueDay(),
                entity.getFrequency(),
                entity.isActive(),
                entity.getCategory() != null ? entity.getCategory().getId() : null,
                entity.getCategory() != null ? entity.getCategory().getName() : null,
                entity.getNotes(),
                entity.getCreatedAt(),
                currentCycleStatus,
                currentCycleOccurrenceId
        );
    }
}
