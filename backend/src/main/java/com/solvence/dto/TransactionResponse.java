package com.solvence.dto;

import com.solvence.entity.Transaction;
import com.solvence.entity.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record TransactionResponse(
        Long id,
        BigDecimal amount,
        TransactionType type,
        Long categoryId,
        String categoryName,
        String categorySlug,
        String description,
        LocalDate transactionDate,
        BigDecimal lifeHours,
        Instant createdAt
) {
    public static TransactionResponse fromEntity(Transaction transaction, BigDecimal lifeHours) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getAmount(),
                transaction.getType(),
                transaction.getCategory().getId(),
                transaction.getCategory().getName(),
                transaction.getCategory().getSlug(),
                transaction.getDescription(),
                transaction.getTransactionDate(),
                lifeHours,
                transaction.getCreatedAt()
        );
    }
}
