package com.solvence.service.runway;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;

/**
 * Calculates pay cycle boundaries and remaining days.
 * Handles month-length variations (Feb 28/29, 30-day months) with deterministic clamping.
 * Days remaining is inclusive of today: ChronoUnit.DAYS.between(today, cycleEnd) + 1.
 */
@Component
public class CycleCalculator {

    private final Clock clock;

    public CycleCalculator(Clock clock) {
        this.clock = clock;
    }

    public PayCycle calculateCycle(int cycleStartDay) {
        return calculateCycle(LocalDate.now(clock), cycleStartDay);
    }

    public PayCycle calculateCycle(LocalDate today, int cycleStartDay) {
        if (cycleStartDay < 1 || cycleStartDay > 31) {
            throw new IllegalArgumentException("cycle_start_day must be between 1 and 31");
        }

        LocalDate startDate;
        LocalDate endDate;

        int currentMonthLen = today.lengthOfMonth();
        int clampedStartThisMonth = Math.min(cycleStartDay, currentMonthLen);
        LocalDate candidateStartThisMonth = today.withDayOfMonth(clampedStartThisMonth);

        if (!today.isBefore(candidateStartThisMonth)) {
            // Cycle started on or before today in the current calendar month
            startDate = candidateStartThisMonth;
            YearMonth nextYm = YearMonth.from(today).plusMonths(1);
            int nextMonthClampedStart = Math.min(cycleStartDay, nextYm.lengthOfMonth());
            endDate = nextYm.atDay(nextMonthClampedStart).minusDays(1);
        } else {
            // Today is before the start day in current month; cycle started in previous month
            YearMonth prevYm = YearMonth.from(today).minusMonths(1);
            int prevMonthClampedStart = Math.min(cycleStartDay, prevYm.lengthOfMonth());
            startDate = prevYm.atDay(prevMonthClampedStart);
            endDate = candidateStartThisMonth.minusDays(1);
        }

        // Calculate days remaining (inclusive of today)
        long daysRemaining;
        if (today.isAfter(endDate)) {
            daysRemaining = 0;
        } else if (today.isBefore(startDate)) {
            // If today is somehow before start, inclusive days from start to end
            daysRemaining = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        } else {
            daysRemaining = ChronoUnit.DAYS.between(today, endDate) + 1;
        }

        if (daysRemaining < 0) {
            daysRemaining = 0;
        }

        return new PayCycle(startDate, endDate, daysRemaining);
    }
}
