package com.solvence.service.decision;

import com.solvence.dto.CycleEndProjectionResponse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Component
public class CycleEndProjectionCalculator {

    public static final String CONSERVATIVE_DISCLAIMER =
            "Conservative estimate after currently protected bills. If no additional income or discretionary spending occurs, this is the balance remaining after protected bills.";

    public CycleEndProjectionResponse calculateProjection(BigDecimal totalBalance,
                                                          BigDecimal protectedBills,
                                                          LocalDate cycleStart,
                                                          LocalDate cycleEnd,
                                                          long daysRemaining) {
        BigDecimal tb = totalBalance != null ? totalBalance : BigDecimal.ZERO;
        BigDecimal pb = protectedBills != null ? protectedBills : BigDecimal.ZERO;

        BigDecimal projectedCycleEndBalance = tb.subtract(pb);
        boolean isNegative = projectedCycleEndBalance.compareTo(BigDecimal.ZERO) < 0;
        BigDecimal deficitAmount = isNegative
                ? projectedCycleEndBalance.abs().setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        return new CycleEndProjectionResponse(
                tb,
                pb,
                projectedCycleEndBalance,
                isNegative,
                deficitAmount,
                cycleStart,
                cycleEnd,
                daysRemaining,
                CONSERVATIVE_DISCLAIMER
        );
    }
}
