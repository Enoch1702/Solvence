package com.solvence.dto.analytics;

import java.math.BigDecimal;

public record CategoryBreakdownItem(
        Long categoryId,
        String categoryName,
        BigDecimal amount,
        BigDecimal percentage
) {
}
