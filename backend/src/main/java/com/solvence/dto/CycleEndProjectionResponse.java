package com.solvence.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CycleEndProjectionResponse(
        BigDecimal currentTotalBalance,
        BigDecimal protectedBills,
        BigDecimal projectedCycleEndBalance,
        @JsonProperty("isDeficit") boolean isDeficit,
        BigDecimal deficitAmount,
        LocalDate cycleStart,
        LocalDate cycleEnd,
        long daysRemaining,
        String message
) {
    @JsonProperty("isNegative")
    public boolean isNegative() {
        return isDeficit;
    }
}
