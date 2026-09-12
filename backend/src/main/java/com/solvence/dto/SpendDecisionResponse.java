package com.solvence.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.solvence.model.decision.DecisionStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SpendDecisionResponse(
        DecisionStatus decision,
        BigDecimal amount,
        String currency,
        BigDecimal totalBalance,
        BigDecimal protectedBills,
        BigDecimal spendingMoney,
        BigDecimal safeToSpendToday,
        long daysRemaining,
        BigDecimal hypotheticalSpendingMoney,
        BigDecimal hypotheticalSafeToSpendToday,
        BigDecimal projectedCycleEndBalance,
        BigDecimal laborCostHours,
        @JsonProperty("isDeficit") boolean isDeficit,
        BigDecimal deficitAmount,
        String message,
        LocalDate cycleStart,
        LocalDate cycleEnd
) {
}
