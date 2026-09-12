package com.solvence.service.decision;

import com.solvence.dto.CycleEndProjectionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class CycleEndProjectionCalculatorTest {

    private CycleEndProjectionCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new CycleEndProjectionCalculator();
    }

    @Test
    @DisplayName("Positive projected balance calculation")
    void testPositiveProjectedBalance() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);

        CycleEndProjectionResponse response = calculator.calculateProjection(
                new BigDecimal("53000.00"),
                new BigDecimal("15000.00"),
                start, end, 19
        );

        assertEquals(new BigDecimal("38000.00"), response.projectedCycleEndBalance());
        assertFalse(response.isNegative());
        assertEquals(new BigDecimal("0.00"), response.deficitAmount());
        assertEquals(CycleEndProjectionCalculator.CONSERVATIVE_DISCLAIMER, response.message());
    }

    @Test
    @DisplayName("Zero projected balance calculation")
    void testZeroProjectedBalance() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);

        CycleEndProjectionResponse response = calculator.calculateProjection(
                new BigDecimal("15000.00"),
                new BigDecimal("15000.00"),
                start, end, 19
        );

        assertEquals(new BigDecimal("0.00"), response.projectedCycleEndBalance());
        assertFalse(response.isNegative());
        assertEquals(new BigDecimal("0.00"), response.deficitAmount());
    }

    @Test
    @DisplayName("Negative projected balance calculation flags deficit")
    void testNegativeProjectedBalance() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);

        CycleEndProjectionResponse response = calculator.calculateProjection(
                new BigDecimal("10000.00"),
                new BigDecimal("15000.00"),
                start, end, 19
        );

        assertEquals(new BigDecimal("-5000.00"), response.projectedCycleEndBalance());
        assertTrue(response.isNegative());
        assertTrue(response.isDeficit());
        assertEquals(new BigDecimal("5000.00"), response.deficitAmount());
    }

    @Test
    @DisplayName("Boundary: Zero protected bills means projected balance equals total balance")
    void testZeroProtectedBills() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);

        CycleEndProjectionResponse response = calculator.calculateProjection(
                new BigDecimal("53000.00"),
                BigDecimal.ZERO,
                start, end, 19
        );

        assertEquals(new BigDecimal("53000.00"), response.projectedCycleEndBalance());
        assertFalse(response.isDeficit());
        assertEquals(new BigDecimal("0.00"), response.deficitAmount());
        assertTrue(response.message().contains("Conservative estimate after currently protected bills"));
    }
}
