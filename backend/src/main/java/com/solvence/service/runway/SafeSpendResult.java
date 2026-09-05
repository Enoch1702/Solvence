package com.solvence.service.runway;

import java.math.BigDecimal;

public record SafeSpendResult(
        BigDecimal availableCash,
        BigDecimal safeDailySpend
) {
}
