package com.solvence.service.decision;

import com.solvence.dto.SpendingPaceResponse;
import com.solvence.model.decision.PaceStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
public class SpendingPaceCalculator {

    public SpendingPaceResponse calculatePace(LocalDate cycleStart,
                                             LocalDate cycleEnd,
                                             LocalDate today,
                                             BigDecimal totalExpenses,
                                             BigDecimal spendingMoney,
                                             BigDecimal safeToSpendToday,
                                             long daysRemaining) {
        BigDecimal expenses = totalExpenses != null ? totalExpenses : BigDecimal.ZERO;
        BigDecimal sm = spendingMoney != null ? spendingMoney : BigDecimal.ZERO;
        BigDecimal safeToday = safeToSpendToday != null ? safeToSpendToday : BigDecimal.ZERO;

        long totalCycleDays = (cycleStart != null && cycleEnd != null)
                ? ChronoUnit.DAYS.between(cycleStart, cycleEnd) + 1
                : 30;
        if (totalCycleDays < 1) {
            totalCycleDays = 1;
        }

        long elapsedDays;
        if (cycleStart == null || today == null) {
            elapsedDays = 1;
        } else if (today.isBefore(cycleStart)) {
            elapsedDays = 0;
        } else if (cycleEnd != null && today.isAfter(cycleEnd)) {
            elapsedDays = totalCycleDays;
        } else {
            elapsedDays = ChronoUnit.DAYS.between(cycleStart, today) + 1;
        }

        long divisorDays = Math.max(1, elapsedDays);

        BigDecimal averageDailyExpensePace;
        if (expenses.compareTo(BigDecimal.ZERO) <= 0 || elapsedDays <= 0) {
            averageDailyExpensePace = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        } else {
            averageDailyExpensePace = expenses.divide(BigDecimal.valueOf(divisorDays), 2, RoundingMode.HALF_UP);
        }

        PaceStatus paceStatus;
        String message;
        if (expenses.compareTo(BigDecimal.ZERO) <= 0) {
            paceStatus = PaceStatus.NO_SPENDING_DATA;
            message = "No expenses recorded in the current pay cycle yet.";
        } else if (averageDailyExpensePace.compareTo(safeToday) > 0) {
            paceStatus = PaceStatus.ABOVE_PACE;
            message = "Your average daily spending pace exceeds today's safe spending capacity.";
        } else if (averageDailyExpensePace.compareTo(safeToday) == 0) {
            paceStatus = PaceStatus.AT_PACE;
            message = "Your average daily spending pace matches today's safe spending capacity.";
        } else {
            paceStatus = PaceStatus.BELOW_PACE;
            message = "Your average daily spending pace is below today's safe spending capacity.";
        }

        boolean isAbovePace = (paceStatus == PaceStatus.ABOVE_PACE);

        return new SpendingPaceResponse(
                elapsedDays,
                daysRemaining,
                totalCycleDays,
                expenses.setScale(2, RoundingMode.HALF_UP),
                averageDailyExpensePace,
                sm,
                safeToday,
                paceStatus,
                isAbovePace,
                message
        );
    }
}
