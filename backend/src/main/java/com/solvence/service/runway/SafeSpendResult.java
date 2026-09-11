package com.solvence.service.runway;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record SafeSpendResult(
        BigDecimal availableCash,
        BigDecimal safeDailySpend,
        boolean isDeficit,
        BigDecimal deficitAmount
) {
    public SafeSpendResult(BigDecimal availableCash, BigDecimal safeDailySpend) {
        this(
                availableCash,
                safeDailySpend,
                availableCash != null && availableCash.compareTo(BigDecimal.ZERO) < 0,
                availableCash != null && availableCash.compareTo(BigDecimal.ZERO) < 0 ? availableCash.abs().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
        );
    }
}
