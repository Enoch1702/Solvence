package com.solvence.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.solvence.model.decision.PaceStatus;

import java.math.BigDecimal;

public record SpendingPaceResponse(
        long elapsedDays,
        long daysRemaining,
        long totalCycleDays,
        BigDecimal totalExpenses,
        BigDecimal averageDailyExpensePace,
        BigDecimal spendingMoney,
        BigDecimal safeToSpendToday,
        PaceStatus paceStatus,
        @JsonProperty("isAbovePace") boolean isAbovePace,
        String message
) {
}
