package com.solvence.dto.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BurnTrajectoryPoint(
        LocalDate date,
        BigDecimal dailyExpenses,
        BigDecimal cumulativeExpenses,
        BigDecimal dailyIncome,
        BigDecimal cumulativeIncome,
        BigDecimal netCashflow
) {
}
