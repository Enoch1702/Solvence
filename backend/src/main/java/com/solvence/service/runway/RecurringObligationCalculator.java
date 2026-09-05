package com.solvence.service.runway;

import com.solvence.entity.RecurringObligation;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

/**
 * Calculates Committed Bills for the remaining portion of the current pay cycle.
 * Clamps due days (e.g. 31st in 28/30 day months) and includes only obligations
 * whose due date falls between today and cycleEnd (inclusive).
 */
@Component
public class RecurringObligationCalculator {

    public BigDecimal calculateCommittedBills(List<RecurringObligation> obligations,
                                              LocalDate today,
                                              LocalDate cycleStart,
                                              LocalDate cycleEnd) {
        if (obligations == null || obligations.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal total = BigDecimal.ZERO;

        // Collect all distinct YearMonths spanned by the cycle [cycleStart, cycleEnd]
        List<YearMonth> monthsInCycle = new ArrayList<>();
        YearMonth currentYm = YearMonth.from(cycleStart);
        YearMonth endYm = YearMonth.from(cycleEnd);
        while (!currentYm.isAfter(endYm)) {
            monthsInCycle.add(currentYm);
            currentYm = currentYm.plusMonths(1);
        }

        for (RecurringObligation obligation : obligations) {
            if (!obligation.isActive() || obligation.getAmount() == null) {
                continue;
            }

            int dueDay = obligation.getDueDay();

            for (YearMonth ym : monthsInCycle) {
                int clampedDay = Math.min(dueDay, ym.lengthOfMonth());
                LocalDate dueDate = ym.atDay(clampedDay);

                // Obligation is due in this cycle and in the remaining portion (>= today)
                if (!dueDate.isBefore(cycleStart) && !dueDate.isAfter(cycleEnd) && !dueDate.isBefore(today)) {
                    total = total.add(obligation.getAmount());
                }
            }
        }

        return total;
    }
}
