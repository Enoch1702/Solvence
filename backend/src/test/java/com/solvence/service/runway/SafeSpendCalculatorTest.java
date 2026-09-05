package com.solvence.service.runway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SafeSpendCalculatorTest {

    private SafeSpendCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new SafeSpendCalculator();
    }

    @Test
    void testVerificationScenarioSafeDailySpendCalculation() {
        BigDecimal liquidReserve = new BigDecimal("53000.00");
        BigDecimal committedBills = new BigDecimal("15000.00");
        long daysRemaining = 19;

        SafeSpendResult result = calculator.calculateSafeSpend(liquidReserve, committedBills, daysRemaining);

        assertEquals(new BigDecimal("38000.00"), result.availableCash());
        assertEquals(new BigDecimal("2000.00"), result.safeDailySpend());
    }

    @Test
    void testZeroDaysRemainingDoesNotDivideByZero() {
        BigDecimal liquidReserve = new BigDecimal("1000.00");
        BigDecimal committedBills = new BigDecimal("200.00");
        long daysRemaining = 0;

        SafeSpendResult result = calculator.calculateSafeSpend(liquidReserve, committedBills, daysRemaining);

        assertEquals(new BigDecimal("800.00"), result.availableCash());
        assertEquals(new BigDecimal("800.00"), result.safeDailySpend());
    }

    @Test
    void testNegativeAvailableCashSetsSafeSpendToZero() {
        BigDecimal liquidReserve = new BigDecimal("5000.00");
        BigDecimal committedBills = new BigDecimal("12000.00");
        long daysRemaining = 10;

        SafeSpendResult result = calculator.calculateSafeSpend(liquidReserve, committedBills, daysRemaining);

        assertEquals(new BigDecimal("-7000.00"), result.availableCash());
        assertEquals(new BigDecimal("0.00"), result.safeDailySpend());
    }

    @Test
    void testZeroAvailableCashSetsSafeSpendToZero() {
        BigDecimal liquidReserve = new BigDecimal("5000.00");
        BigDecimal committedBills = new BigDecimal("5000.00");
        long daysRemaining = 10;

        SafeSpendResult result = calculator.calculateSafeSpend(liquidReserve, committedBills, daysRemaining);

        assertEquals(new BigDecimal("0.00"), result.availableCash());
        assertEquals(new BigDecimal("0.00"), result.safeDailySpend());
    }
}
