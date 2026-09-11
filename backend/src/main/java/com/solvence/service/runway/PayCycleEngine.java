package com.solvence.service.runway;

import com.solvence.entity.PayCycleType;
import com.solvence.entity.User;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;

@Component
public class PayCycleEngine {

    private final Clock clock;

    public PayCycleEngine(Clock clock) {
        this.clock = clock;
    }

    public PayCycle calculateCycle(User user) {
        return calculateCycle(user, LocalDate.now(clock));
    }

    public PayCycle calculateCycle(User user, LocalDate today) {
        PayCycleType type = user.getPayCycleType() != null ? user.getPayCycleType() : PayCycleType.MONTHLY;

        return switch (type) {
            case MONTHLY -> calculateMonthly(user.getPayCycleStartDay(), today);
            case BIWEEKLY -> calculateBiweekly(user.getPayCycleAnchorDate(), today);
            case SEMI_MONTHLY -> calculateSemiMonthly(user.getPayCycleStartDay(), user.getPayCycleSecondDay(), today);
        };
    }

    public PayCycle calculateMonthly(Integer startDayParam, LocalDate today) {
        int startDay = (startDayParam != null && startDayParam >= 1 && startDayParam <= 31) ? startDayParam : 1;

        LocalDate startDate;
        LocalDate endDate;

        int currentMonthLen = today.lengthOfMonth();
        int clampedStartThisMonth = Math.min(startDay, currentMonthLen);
        LocalDate candidateStartThisMonth = today.withDayOfMonth(clampedStartThisMonth);

        if (!today.isBefore(candidateStartThisMonth)) {
            startDate = candidateStartThisMonth;
            YearMonth nextYm = YearMonth.from(today).plusMonths(1);
            int nextMonthClampedStart = Math.min(startDay, nextYm.lengthOfMonth());
            endDate = nextYm.atDay(nextMonthClampedStart).minusDays(1);
        } else {
            YearMonth prevYm = YearMonth.from(today).minusMonths(1);
            int prevMonthClampedStart = Math.min(startDay, prevYm.lengthOfMonth());
            startDate = prevYm.atDay(prevMonthClampedStart);
            endDate = candidateStartThisMonth.minusDays(1);
        }

        return buildPayCycle(startDate, endDate, today);
    }

    public PayCycle calculateBiweekly(LocalDate anchorDate, LocalDate today) {
        if (anchorDate == null) {
            throw new IllegalArgumentException("pay_cycle_anchor_date is required for BIWEEKLY pay cycle");
        }

        long daysBetween = ChronoUnit.DAYS.between(anchorDate, today);
        long k = Math.floorDiv(daysBetween, 14);
        LocalDate startDate = anchorDate.plusDays(k * 14);
        LocalDate endDate = startDate.plusDays(13);

        return buildPayCycle(startDate, endDate, today);
    }

    public PayCycle calculateSemiMonthly(Integer firstDayParam, Integer secondDayParam, LocalDate today) {
        int firstDay = firstDayParam != null ? firstDayParam : 1;
        int secondDay = secondDayParam != null ? secondDayParam : 15;

        if (firstDay < 1 || firstDay >= secondDay || secondDay > 31) {
            throw new IllegalArgumentException("For SEMI_MONTHLY pay cycle, first day must be >= 1, second day <= 31, and first day < second day");
        }

        LocalDate startDate;
        LocalDate endDate;

        int currentMonthLen = today.lengthOfMonth();
        int clampedFirst = Math.min(firstDay, currentMonthLen);
        int clampedSecond = Math.min(secondDay, currentMonthLen);

        if (today.getDayOfMonth() < clampedFirst) {
            YearMonth prevYm = YearMonth.from(today).minusMonths(1);
            int prevClampedSecond = Math.min(secondDay, prevYm.lengthOfMonth());
            startDate = prevYm.atDay(prevClampedSecond);
            endDate = today.withDayOfMonth(clampedFirst).minusDays(1);
        } else if (today.getDayOfMonth() >= clampedFirst && today.getDayOfMonth() < clampedSecond) {
            startDate = today.withDayOfMonth(clampedFirst);
            endDate = today.withDayOfMonth(clampedSecond).minusDays(1);
        } else {
            startDate = today.withDayOfMonth(clampedSecond);
            YearMonth nextYm = YearMonth.from(today).plusMonths(1);
            int nextClampedFirst = Math.min(firstDay, nextYm.lengthOfMonth());
            endDate = nextYm.atDay(nextClampedFirst).minusDays(1);
        }

        return buildPayCycle(startDate, endDate, today);
    }

    private PayCycle buildPayCycle(LocalDate startDate, LocalDate endDate, LocalDate today) {
        long daysRemaining;
        if (today.isAfter(endDate)) {
            daysRemaining = 0;
        } else if (today.isBefore(startDate)) {
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
