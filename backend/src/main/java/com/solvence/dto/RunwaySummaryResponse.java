package com.solvence.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

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
        BigDecimal totalExpenses,
        BigDecimal liquidCash,
        BigDecimal protectedBills,
        @JsonProperty("isDeficit") boolean isDeficit,
        BigDecimal deficitAmount
) {
    public RunwaySummaryResponse(
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
        this(
                liquidReserve,
                committedBills,
                availableCash,
                safeDailySpend,
                daysRemaining,
                hourlyRate,
                cycleStart,
                cycleEnd,
                openingBalance,
                totalIncome,
                totalExpenses,
                liquidReserve,
                committedBills,
                availableCash != null && availableCash.compareTo(BigDecimal.ZERO) < 0,
                availableCash != null && availableCash.compareTo(BigDecimal.ZERO) < 0 ? availableCash.abs() : BigDecimal.ZERO
        );
    }
}
