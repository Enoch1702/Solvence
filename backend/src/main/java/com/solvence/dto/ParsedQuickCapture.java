package com.solvence.dto;

import com.solvence.entity.Category;
import com.solvence.entity.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ParsedQuickCapture(
        BigDecimal amount,
        TransactionType type,
        Category category,
        String description,
        LocalDate transactionDate
) {
}
