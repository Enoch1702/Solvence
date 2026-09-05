package com.solvence.service.runway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;

class CycleCalculatorTest {

    private CycleCalculator cycleCalculator;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(
                LocalDate.of(2026, 3, 15).atStartOfDay(ZoneId.of("UTC")).toInstant(),
                ZoneId.of("UTC")
        );
        cycleCalculator = new CycleCalculator(fixedClock);
    }

    @Test
    void testStandardCycleStartingFirstOfMonth() {
        // Today is 2026-03-15, cycle starts on the 1st
        PayCycle cycle = cycleCalculator.calculateCycle(LocalDate.of(2026, 3, 15), 1);

        assertEquals(LocalDate.of(2026, 3, 1), cycle.startDate());
        assertEquals(LocalDate.of(2026, 3, 31), cycle.endDate());
        // March has 31 days. From March 15 to March 31 inclusive = 31 - 15 + 1 = 17 days
        assertEquals(17, cycle.daysRemaining());
    }

    @Test
    void testCycleStartingMidMonthBeforeToday() {
        // Today is 2026-03-15, cycle starts on the 5th
        PayCycle cycle = cycleCalculator.calculateCycle(LocalDate.of(2026, 3, 15), 5);

        assertEquals(LocalDate.of(2026, 3, 5), cycle.startDate());
        // Next month is April (starts April 5), so cycle ends April 4
        assertEquals(LocalDate.of(2026, 4, 4), cycle.endDate());
        // From March 15 to April 4 inclusive: (31 - 15 + 1) + 4 = 17 + 4 = 21 days
        assertEquals(21, cycle.daysRemaining());
    }

    @Test
    void testCycleStartingMidMonthAfterToday() {
        // Today is 2026-03-10, cycle starts on the 15th
        // Cycle must have started in previous month: Feb 15, 2026
        // Ending on March 14, 2026
        PayCycle cycle = cycleCalculator.calculateCycle(LocalDate.of(2026, 3, 10), 15);

        assertEquals(LocalDate.of(2026, 2, 15), cycle.startDate());
        assertEquals(LocalDate.of(2026, 3, 14), cycle.endDate());
        // From March 10 to March 14 inclusive: 14 - 10 + 1 = 5 days
        assertEquals(5, cycle.daysRemaining());
    }

    @Test
    void testFebruaryLeapYearClamping() {
        // Leap year 2024 (Feb has 29 days), cycleStartDay = 31
        // On 2024-02-10, cycle started in Jan 31, ends Feb 28 (day before clamped Feb 29)
        PayCycle cycleBefore = cycleCalculator.calculateCycle(LocalDate.of(2024, 2, 10), 31);
        assertEquals(LocalDate.of(2024, 1, 31), cycleBefore.startDate());
        assertEquals(LocalDate.of(2024, 2, 28), cycleBefore.endDate());

        // On 2024-02-29, cycle starts Feb 29, ends March 30
        PayCycle cycleOnClamped = cycleCalculator.calculateCycle(LocalDate.of(2024, 2, 29), 31);
        assertEquals(LocalDate.of(2024, 2, 29), cycleOnClamped.startDate());
        assertEquals(LocalDate.of(2024, 3, 30), cycleOnClamped.endDate());
    }

    @Test
    void testFebruaryNonLeapYearClamping() {
        // Non-leap year 2025 (Feb has 28 days), cycleStartDay = 30
        PayCycle cycle = cycleCalculator.calculateCycle(LocalDate.of(2025, 2, 28), 30);
        assertEquals(LocalDate.of(2025, 2, 28), cycle.startDate());
        assertEquals(LocalDate.of(2025, 3, 29), cycle.endDate());
    }

    @Test
    void testThirtyDayMonthCycleStart31() {
        // April has 30 days. cycleStartDay = 31
        // On 2026-04-30 (clamped start), next month is May (length 31, start May 31, end May 30)
        PayCycle cycle = cycleCalculator.calculateCycle(LocalDate.of(2026, 4, 30), 31);
        assertEquals(LocalDate.of(2026, 4, 30), cycle.startDate());
        assertEquals(LocalDate.of(2026, 5, 30), cycle.endDate());
    }

    @Test
    void testDaysRemainingOnLastDayOfCycle() {
        // On cycle end date, remaining days is exactly 1 (today is safe to spend)
        PayCycle cycle = cycleCalculator.calculateCycle(LocalDate.of(2026, 3, 31), 1);
        assertEquals(1, cycle.daysRemaining());
    }

    @Test
    void testInvalidCycleStartDayThrows() {
        assertThrows(IllegalArgumentException.class, () -> cycleCalculator.calculateCycle(LocalDate.now(), 0));
        assertThrows(IllegalArgumentException.class, () -> cycleCalculator.calculateCycle(LocalDate.now(), 32));
    }
}
