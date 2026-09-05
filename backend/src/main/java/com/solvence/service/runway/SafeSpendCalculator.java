package com.solvence.service.runway;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Calculates Available Cash and Safe Daily Spend.
 * Formula:
 * Available Cash = Liquid Reserve - Committed Bills
 * Safe Daily Spend = Available Cash / Days Remaining
 * Handles zero days remaining, negative available cash, and division by zero.
 */
@Component
public class SafeSpendCalculator {

    public SafeSpendResult calculateSafeSpend(BigDecimal liquidReserve, BigDecimal committedBills, long daysRemaining) {
        BigDecimal lr = liquidReserve != null ? liquidReserve : BigDecimal.ZERO;
        BigDecimal cb = committedBills != null ? committedBills : BigDecimal.ZERO;

        BigDecimal availableCash = lr.subtract(cb);

        BigDecimal safeDailySpend;
        if (availableCash.compareTo(BigDecimal.ZERO) <= 0) {
            // Overspent or zero cash
            safeDailySpend = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        } else if (daysRemaining <= 0) {
            // No days remaining, remaining cash is all available today
            safeDailySpend = availableCash.setScale(2, RoundingMode.HALF_UP);
        } else {
            safeDailySpend = availableCash.divide(BigDecimal.valueOf(daysRemaining), 2, RoundingMode.HALF_UP);
        }

        return new SafeSpendResult(availableCash, safeDailySpend);
    }
}
