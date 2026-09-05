package com.solvence.service.runway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BalanceCalculatorTest {

    private BalanceCalculator balanceCalculator;

    @BeforeEach
    void setUp() {
        balanceCalculator = new BalanceCalculator();
    }

    @Test
    void testVerificationScenarioLiquidReserveCalculation() {
        BigDecimal openingBalance = new BigDecimal("25000.00");
        BigDecimal income = new BigDecimal("40000.00");
        BigDecimal expenses = new BigDecimal("12000.00");

        BigDecimal liquidReserve = balanceCalculator.calculateLiquidReserve(openingBalance, income, expenses);

        assertEquals(new BigDecimal("53000.00"), liquidReserve);
    }

    @Test
    void testNullValuesDefaultToZero() {
        BigDecimal result = balanceCalculator.calculateLiquidReserve(null, null, null);
        assertEquals(BigDecimal.ZERO, result);

        BigDecimal partial = balanceCalculator.calculateLiquidReserve(new BigDecimal("1000.00"), null, null);
        assertEquals(new BigDecimal("1000.00"), partial);
    }

    @Test
    void testExpensesExceedingOpeningAndIncomeGivesNegativeReserve() {
        BigDecimal opening = new BigDecimal("500.00");
        BigDecimal income = new BigDecimal("200.00");
        BigDecimal expenses = new BigDecimal("1000.00");

        BigDecimal result = balanceCalculator.calculateLiquidReserve(opening, income, expenses);
        assertEquals(new BigDecimal("-300.00"), result);
    }
}
