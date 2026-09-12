package com.solvence.service.decision;

import com.solvence.dto.SpendingPaceResponse;
import com.solvence.model.decision.PaceStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class SpendingPaceCalculatorTest {

    private SpendingPaceCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new SpendingPaceCalculator();
    }

    @Test
    @DisplayName("No expenses recorded returns NO_SPENDING_DATA status")
    void testNoExpensesReturnsNoSpendingData() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);
        LocalDate today = LocalDate.of(2026, 3, 13);

        SpendingPaceResponse response = calculator.calculatePace(
                start, end, today,
                BigDecimal.ZERO,
                new BigDecimal("38000.00"),
                new BigDecimal("2000.00"),
                19
        );

        assertEquals(PaceStatus.NO_SPENDING_DATA, response.paceStatus());
        assertFalse(response.isAbovePace());
        assertEquals(new BigDecimal("0.00"), response.averageDailyExpensePace());
        assertEquals(13, response.elapsedDays());
        assertEquals(31, response.totalCycleDays());
    }

    @Test
    @DisplayName("Pace below safe daily spend returns BELOW_PACE")
    void testPaceBelowSafeDailySpendReturnsBelowPace() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);
        LocalDate today = LocalDate.of(2026, 3, 13); // 13 elapsed days

        // Total expenses = 13,000 -> pace = 13,000 / 13 = 1,000.00 < safeToSpendToday (2,000.00)
        SpendingPaceResponse response = calculator.calculatePace(
                start, end, today,
                new BigDecimal("13000.00"),
                new BigDecimal("38000.00"),
                new BigDecimal("2000.00"),
                19
        );

        assertEquals(PaceStatus.BELOW_PACE, response.paceStatus());
        assertFalse(response.isAbovePace());
        assertEquals(new BigDecimal("1000.00"), response.averageDailyExpensePace());
    }

    @Test
    @DisplayName("Pace equal to safe daily spend returns AT_PACE")
    void testPaceEqualToSafeDailySpendReturnsAtPace() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);
        LocalDate today = LocalDate.of(2026, 3, 10); // 10 elapsed days

        // Total expenses = 20,000 -> pace = 20,000 / 10 = 2,000.00 == safeToSpendToday (2,000.00)
        SpendingPaceResponse response = calculator.calculatePace(
                start, end, today,
                new BigDecimal("20000.00"),
                new BigDecimal("38000.00"),
                new BigDecimal("2000.00"),
                22
        );

        assertEquals(PaceStatus.AT_PACE, response.paceStatus());
        assertFalse(response.isAbovePace());
        assertEquals(new BigDecimal("2000.00"), response.averageDailyExpensePace());
    }

    @Test
    @DisplayName("Pace exceeding safe daily spend returns ABOVE_PACE")
    void testPaceExceedingSafeDailySpendReturnsAbovePace() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);
        LocalDate today = LocalDate.of(2026, 3, 10); // 10 elapsed days

        // Total expenses = 30,000 -> pace = 30,000 / 10 = 3,000.00 > safeToSpendToday (2,000.00)
        SpendingPaceResponse response = calculator.calculatePace(
                start, end, today,
                new BigDecimal("30000.00"),
                new BigDecimal("38000.00"),
                new BigDecimal("2000.00"),
                22
        );

        assertEquals(PaceStatus.ABOVE_PACE, response.paceStatus());
        assertTrue(response.isAbovePace());
        assertEquals(new BigDecimal("3000.00"), response.averageDailyExpensePace());
    }

    @Test
    @DisplayName("Cycle start date equals today: elapsedDays = 1, division is safe")
    void testCycleStartEqualsToday() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);
        LocalDate today = LocalDate.of(2026, 3, 1);

        SpendingPaceResponse response = calculator.calculatePace(
                start, end, today,
                new BigDecimal("500.00"),
                new BigDecimal("38000.00"),
                new BigDecimal("1000.00"),
                31
        );

        assertEquals(1, response.elapsedDays());
        assertEquals(new BigDecimal("500.00"), response.averageDailyExpensePace());
        assertEquals(PaceStatus.BELOW_PACE, response.paceStatus());
    }

    @Test
    @DisplayName("Biweekly cycle (14 days) pace calculation")
    void testBiweeklyCyclePace() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 14);
        LocalDate today = LocalDate.of(2026, 3, 7); // 7 elapsed days

        SpendingPaceResponse response = calculator.calculatePace(
                start, end, today,
                new BigDecimal("7000.00"),
                new BigDecimal("14000.00"),
                new BigDecimal("1000.00"),
                8
        );

        assertEquals(14, response.totalCycleDays());
        assertEquals(7, response.elapsedDays());
        assertEquals(new BigDecimal("1000.00"), response.averageDailyExpensePace());
        assertEquals(PaceStatus.AT_PACE, response.paceStatus());
        assertEquals("Historical average daily expense pace equals the remaining daily capacity.", response.message());
    }

    @Test
    @DisplayName("Boundary: Today before cycle start produces 0 elapsed days and 0.00 pace without division error")
    void testTodayBeforeCycleStartProducesZeroElapsedDays() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);
        LocalDate today = LocalDate.of(2026, 2, 28); // before cycle start

        SpendingPaceResponse response = calculator.calculatePace(
                start, end, today,
                BigDecimal.ZERO,
                new BigDecimal("38000.00"),
                new BigDecimal("2000.00"),
                31
        );

        assertEquals(0, response.elapsedDays());
        assertEquals(new BigDecimal("0.00"), response.averageDailyExpensePace());
        assertEquals(PaceStatus.NO_SPENDING_DATA, response.paceStatus());
        assertEquals("No expenses recorded in the current pay cycle yet.", response.message());
    }

    @Test
    @DisplayName("Boundary: Today on cycle end day has elapsedDays equal to totalCycleDays")
    void testTodayOnCycleEndDay() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);
        LocalDate today = LocalDate.of(2026, 3, 31); // 31 elapsed days

        SpendingPaceResponse response = calculator.calculatePace(
                start, end, today,
                new BigDecimal("31000.00"),
                new BigDecimal("1000.00"),
                new BigDecimal("1000.00"),
                1
        );

        assertEquals(31, response.elapsedDays());
        assertEquals(31, response.totalCycleDays());
        assertEquals(new BigDecimal("1000.00"), response.averageDailyExpensePace());
        assertEquals(PaceStatus.AT_PACE, response.paceStatus());
    }

    @Test
    @DisplayName("Boundary: Today after cycle end clamps elapsedDays to totalCycleDays")
    void testTodayAfterCycleEndClampsElapsedDays() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);
        LocalDate today = LocalDate.of(2026, 4, 2); // after cycle end

        SpendingPaceResponse response = calculator.calculatePace(
                start, end, today,
                new BigDecimal("31000.00"),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                0
        );

        assertEquals(31, response.elapsedDays());
        assertEquals(31, response.totalCycleDays());
        assertEquals(new BigDecimal("1000.00"), response.averageDailyExpensePace());
    }

    @Test
    @DisplayName("Exact scale normalization: unscaled pace equal to unscaled safe daily spend returns AT_PACE")
    void testScaleNormalizationForExactPaceComparison() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);
        LocalDate today = LocalDate.of(2026, 3, 10); // 10 elapsed days

        // 20,000 / 10 = 2,000.00 compared against new BigDecimal("2000") (scale 0)
        SpendingPaceResponse response = calculator.calculatePace(
                start, end, today,
                new BigDecimal("20000"),
                new BigDecimal("38000.00"),
                new BigDecimal("2000"), // different scale
                22
        );

        assertEquals(PaceStatus.AT_PACE, response.paceStatus());
        assertEquals("Historical average daily expense pace equals the remaining daily capacity.", response.message());
        assertTrue(response.isAboveSafeCapacity() == false);
    }
}
