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

        // Inclusive elapsed calendar days: cycleStart through today
        long elapsedDays;
        if (cycleStart == null || today == null) {
            elapsedDays = 1;
        } else if (today.isBefore(cycleStart)) {
            // Explicit 0 elapsed days if today is before the cycle start boundary
            elapsedDays = 0;
        } else if (cycleEnd != null && today.isAfter(cycleEnd)) {
            // Clamped to total cycle days if evaluated after cycle completion
            elapsedDays = totalCycleDays;
        } else {
            // Phase 0 inclusive calendar day count
            elapsedDays = ChronoUnit.DAYS.between(cycleStart, today) + 1;
        }

        BigDecimal averageDailyExpensePace;
        if (elapsedDays <= 0 || expenses.compareTo(BigDecimal.ZERO) <= 0) {
            averageDailyExpensePace = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        } else {
            averageDailyExpensePace = expenses.divide(BigDecimal.valueOf(elapsedDays), 2, RoundingMode.HALF_UP);
        }

        // Scale normalization before directional comparison
        BigDecimal paceNorm = averageDailyExpensePace.setScale(2, RoundingMode.HALF_UP);
        BigDecimal safeNorm = safeToday.setScale(2, RoundingMode.HALF_UP);

        PaceStatus paceStatus;
        String message;
        if (expenses.compareTo(BigDecimal.ZERO) <= 0) {
            paceStatus = PaceStatus.NO_SPENDING_DATA;
            message = "No expenses recorded in the current pay cycle yet.";
        } else if (paceNorm.compareTo(safeNorm) > 0) {
            paceStatus = PaceStatus.ABOVE_PACE;
            message = "Historical average daily expense pace is above the remaining daily capacity.";
        } else if (paceNorm.compareTo(safeNorm) == 0) {
            paceStatus = PaceStatus.AT_PACE;
            message = "Historical average daily expense pace equals the remaining daily capacity.";
        } else {
            paceStatus = PaceStatus.BELOW_PACE;
            message = "Historical average daily expense pace is below the remaining daily capacity.";
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
