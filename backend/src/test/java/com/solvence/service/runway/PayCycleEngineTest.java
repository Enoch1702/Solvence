package com.solvence.service.runway;

import com.solvence.entity.PayCycleType;
import com.solvence.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;

class PayCycleEngineTest {

    private PayCycleEngine engine;
    private final LocalDate baseDate = LocalDate.of(2026, 3, 13);
    private final Clock fixedClock = Clock.fixed(baseDate.atStartOfDay(ZoneId.of("UTC")).toInstant(), ZoneId.of("UTC"));

    @BeforeEach
    void setUp() {
        engine = new PayCycleEngine(fixedClock);
    }

    @Test
    void testMonthlyStandardCycle() {
        // Start day 1 in March 2026: 2026-03-01 to 2026-03-31
        PayCycle cycle = engine.calculateMonthly(1, LocalDate.of(2026, 3, 13));
        assertEquals(LocalDate.of(2026, 3, 1), cycle.startDate());
        assertEquals(LocalDate.of(2026, 3, 31), cycle.endDate());
        // March 13 to 31 inclusive: 31 - 13 + 1 = 19
        assertEquals(19, cycle.daysRemaining());
    }

    @Test
    void testMonthlyMidMonthCycle() {
        // Start day 15 in March 2026. If today is March 13 (before 15th):
        // Current cycle started Feb 15, 2026 and ends March 14, 2026
        PayCycle cycle = engine.calculateMonthly(15, LocalDate.of(2026, 3, 13));
        assertEquals(LocalDate.of(2026, 2, 15), cycle.startDate());
        assertEquals(LocalDate.of(2026, 3, 14), cycle.endDate());
        // March 13 to March 14 inclusive: 2 days
        assertEquals(2, cycle.daysRemaining());

        // If today is March 15, 2026:
        // Cycle starts March 15, 2026 and ends April 14, 2026
        PayCycle cycleNext = engine.calculateMonthly(15, LocalDate.of(2026, 3, 15));
        assertEquals(LocalDate.of(2026, 3, 15), cycleNext.startDate());
        assertEquals(LocalDate.of(2026, 4, 14), cycleNext.endDate());
        // March 15 to April 14 inclusive: (31 - 15 + 1) + 14 = 17 + 14 = 31 days
        assertEquals(31, cycleNext.daysRemaining());
    }

    @Test
    void testMonthlyClampingInFebruaryNonLeapYear() {
        // Start day 31. February 2026 has 28 days.
        // Today is Feb 10, 2026: previous cycle started Jan 31, ends Feb 27 (day before Feb 28)
        PayCycle cycle = engine.calculateMonthly(31, LocalDate.of(2026, 2, 10));
        assertEquals(LocalDate.of(2026, 1, 31), cycle.startDate());
        assertEquals(LocalDate.of(2026, 2, 27), cycle.endDate());

        // Today is Feb 28, 2026 (clamped 31 -> 28): new cycle starts Feb 28, ends March 30
        PayCycle cycleFeb28 = engine.calculateMonthly(31, LocalDate.of(2026, 2, 28));
        assertEquals(LocalDate.of(2026, 2, 28), cycleFeb28.startDate());
        assertEquals(LocalDate.of(2026, 3, 30), cycleFeb28.endDate());
    }

    @Test
    void testBiweeklyCycle() {
        LocalDate anchor = LocalDate.of(2026, 1, 2); // A Friday payday
        // Today is 2026-03-13 (which is 70 days after Jan 2: 70 = 5 * 14)
        PayCycle cycle = engine.calculateBiweekly(anchor, LocalDate.of(2026, 3, 13));
        assertEquals(LocalDate.of(2026, 3, 13), cycle.startDate());
        assertEquals(LocalDate.of(2026, 3, 26), cycle.endDate());
        assertEquals(14, cycle.daysRemaining());

        // Test mid-cycle: 2026-03-20 (day 8 of 14)
        PayCycle midCycle = engine.calculateBiweekly(anchor, LocalDate.of(2026, 3, 20));
        assertEquals(LocalDate.of(2026, 3, 13), midCycle.startDate());
        assertEquals(LocalDate.of(2026, 3, 26), midCycle.endDate());
        // March 20 to 26 inclusive = 7 days
        assertEquals(7, midCycle.daysRemaining());
    }

    @Test
    void testBiweeklyDateBeforeAnchor() {
        LocalDate anchor = LocalDate.of(2026, 3, 13);
        // Date before anchor: 2026-03-01 (-12 days -> floorDiv(-12, 14) = -1 -> anchor - 14 = 2026-02-27)
        PayCycle cycle = engine.calculateBiweekly(anchor, LocalDate.of(2026, 3, 1));
        assertEquals(LocalDate.of(2026, 2, 27), cycle.startDate());
        assertEquals(LocalDate.of(2026, 3, 12), cycle.endDate());
        // March 1 to March 12 inclusive = 12 days
        assertEquals(12, cycle.daysRemaining());
    }

    @Test
    void testSemiMonthlyCycle() {
        // 1st and 15th
        // On March 5: first half (March 1 to March 14)
        PayCycle firstHalf = engine.calculateSemiMonthly(1, 15, LocalDate.of(2026, 3, 5));
        assertEquals(LocalDate.of(2026, 3, 1), firstHalf.startDate());
        assertEquals(LocalDate.of(2026, 3, 14), firstHalf.endDate());
        assertEquals(10, firstHalf.daysRemaining());

        // On March 20: second half (March 15 to March 31)
        PayCycle secondHalf = engine.calculateSemiMonthly(1, 15, LocalDate.of(2026, 3, 20));
        assertEquals(LocalDate.of(2026, 3, 15), secondHalf.startDate());
        assertEquals(LocalDate.of(2026, 3, 31), secondHalf.endDate());
        assertEquals(12, secondHalf.daysRemaining());
    }

    @Test
    void testCalculateCycleForUser() {
        User user = new User();
        user.setPayCycleType(PayCycleType.MONTHLY);
        user.setPayCycleStartDay(1);

        PayCycle cycle = engine.calculateCycle(user);
        assertEquals(LocalDate.of(2026, 3, 1), cycle.startDate());
        assertEquals(LocalDate.of(2026, 3, 31), cycle.endDate());
    }
}
