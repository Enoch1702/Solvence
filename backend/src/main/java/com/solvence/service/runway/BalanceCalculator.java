package com.solvence.service.runway;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Calculates Liquid Reserve:
 * Opening Balance + Sum(Income) - Sum(Expenses)
 * Strictly using BigDecimal precision.
 */
@Component
public class BalanceCalculator {

    public BigDecimal calculateLiquidReserve(BigDecimal openingBalance, BigDecimal income, BigDecimal expenses) {
        BigDecimal ob = openingBalance != null ? openingBalance : BigDecimal.ZERO;
        BigDecimal inc = income != null ? income : BigDecimal.ZERO;
        BigDecimal exp = expenses != null ? expenses : BigDecimal.ZERO;

        return ob.add(inc).subtract(exp);
    }
}
