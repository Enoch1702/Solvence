package com.solvence.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RunwaySummaryResponse(
        BigDecimal liquidReserve,
        BigDecimal committedBills,
        BigDecimal availableCash,
        BigDecimal safeDailySpend,
        long daysRemaining,
        BigDecimal hourlyRate,
        LocalDate cycleStart,
        LocalDate cycleEnd,
        BigDecimal openingBalance,
        BigDecimal totalIncome,
        BigDecimal totalExpenses
) {
}
