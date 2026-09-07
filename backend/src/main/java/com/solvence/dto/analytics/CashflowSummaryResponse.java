package com.solvence.dto.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CashflowSummaryResponse(
        BigDecimal totalIncome,
        BigDecimal totalExpenses,
        BigDecimal netCashflow,
        long transactionCount,
        LocalDate cycleStart,
        LocalDate cycleEnd
) {
}
