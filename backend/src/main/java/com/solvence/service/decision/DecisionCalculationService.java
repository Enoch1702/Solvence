package com.solvence.service.decision;

import com.solvence.dto.RunwaySummaryResponse;
import com.solvence.dto.SpendDecisionResponse;
import com.solvence.exception.BusinessValidationException;
import com.solvence.model.decision.DecisionStatus;
import com.solvence.service.runway.LifeHourCalculator;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class DecisionCalculationService {

    private final LifeHourCalculator lifeHourCalculator;

    public DecisionCalculationService(LifeHourCalculator lifeHourCalculator) {
        this.lifeHourCalculator = lifeHourCalculator;
    }

    public SpendDecisionResponse evaluateSpend(RunwaySummaryResponse runway, BigDecimal amount, BigDecimal hourlyRate, String currency) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Enter an amount greater than zero.");
        }

        BigDecimal totalBalance = runway.liquidCash() != null ? runway.liquidCash() : BigDecimal.ZERO;
        BigDecimal protectedBills = runway.protectedBills() != null ? runway.protectedBills() : BigDecimal.ZERO;
        BigDecimal spendingMoney = runway.availableCash() != null ? runway.availableCash() : BigDecimal.ZERO;
        BigDecimal safeToSpendToday = runway.safeDailySpend() != null ? runway.safeDailySpend() : BigDecimal.ZERO;
        long daysRemaining = runway.daysRemaining();

        BigDecimal hypotheticalSpendingMoney = spendingMoney.subtract(amount);

        BigDecimal hypotheticalSafeToSpendToday;
        if (hypotheticalSpendingMoney.compareTo(BigDecimal.ZERO) <= 0 || daysRemaining <= 0) {
            hypotheticalSafeToSpendToday = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        } else {
            hypotheticalSafeToSpendToday = hypotheticalSpendingMoney.divide(
                    BigDecimal.valueOf(daysRemaining), 2, RoundingMode.HALF_UP);
        }

        BigDecimal projectedCycleEndBalance = hypotheticalSpendingMoney;

        DecisionStatus decision;
        String message;
        if (hypotheticalSpendingMoney.compareTo(BigDecimal.ZERO) < 0) {
            decision = DecisionStatus.NOT_SAFE;
            message = "This would put your spending money below zero after protected bills.";
        } else if (amount.compareTo(safeToSpendToday) <= 0) {
            decision = DecisionStatus.SAFE;
            message = "This fits within today's safe spending amount.";
        } else {
            decision = DecisionStatus.CAUTION;
            message = "You can cover this from current spending money, but it is above today's safe amount.";
        }

        boolean isDeficit = hypotheticalSpendingMoney.compareTo(BigDecimal.ZERO) < 0;
        BigDecimal deficitAmount = isDeficit
                ? hypotheticalSpendingMoney.abs().setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        BigDecimal laborCostHours = lifeHourCalculator.calculateLifeHours(amount, hourlyRate);

        return new SpendDecisionResponse(
                decision,
                amount.setScale(2, RoundingMode.HALF_UP),
                currency != null ? currency : "INR",
                totalBalance,
                protectedBills,
                spendingMoney,
                safeToSpendToday,
                daysRemaining,
                hypotheticalSpendingMoney,
                hypotheticalSafeToSpendToday,
                projectedCycleEndBalance,
                laborCostHours,
                isDeficit,
                deficitAmount,
                message,
                runway.cycleStart(),
                runway.cycleEnd()
        );
    }
}
