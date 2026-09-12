package com.solvence.service.decision;

import com.solvence.dto.CycleEndProjectionResponse;
import com.solvence.dto.DecisionSummaryResponse;
import com.solvence.dto.RunwaySummaryResponse;
import com.solvence.dto.SpendDecisionRequest;
import com.solvence.dto.SpendDecisionResponse;
import com.solvence.dto.SpendingPaceResponse;
import com.solvence.entity.TransactionType;
import com.solvence.entity.User;
import com.solvence.exception.ResourceNotFoundException;
import com.solvence.repository.TransactionRepository;
import com.solvence.repository.UserRepository;
import com.solvence.security.CurrentUserProvider;
import com.solvence.service.runway.RunwayCalculationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;

@Service
public class DecisionEngineService {

    private final CurrentUserProvider currentUserProvider;
    private final UserRepository userRepository;
    private final RunwayCalculationService runwayCalculationService;
    private final TransactionRepository transactionRepository;
    private final DecisionCalculationService decisionCalculationService;
    private final SpendingPaceCalculator spendingPaceCalculator;
    private final CycleEndProjectionCalculator cycleEndProjectionCalculator;
    private final Clock clock;

    public DecisionEngineService(CurrentUserProvider currentUserProvider,
                                 UserRepository userRepository,
                                 RunwayCalculationService runwayCalculationService,
                                 TransactionRepository transactionRepository,
                                 DecisionCalculationService decisionCalculationService,
                                 SpendingPaceCalculator spendingPaceCalculator,
                                 CycleEndProjectionCalculator cycleEndProjectionCalculator,
                                 Clock clock) {
        this.currentUserProvider = currentUserProvider;
        this.userRepository = userRepository;
        this.runwayCalculationService = runwayCalculationService;
        this.transactionRepository = transactionRepository;
        this.decisionCalculationService = decisionCalculationService;
        this.spendingPaceCalculator = spendingPaceCalculator;
        this.cycleEndProjectionCalculator = cycleEndProjectionCalculator;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public SpendDecisionResponse evaluateSpend(SpendDecisionRequest request) {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        RunwaySummaryResponse runway = runwayCalculationService.getRunwaySummary();
        return decisionCalculationService.evaluateSpend(runway, request.amount(), user.getHourlyRate(), user.getCurrency());
    }

    @Transactional(readOnly = true)
    public SpendingPaceResponse getSpendingPace() {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        LocalDate today = LocalDate.now(clock);
        RunwaySummaryResponse runway = runwayCalculationService.getRunwaySummary();

        LocalDate cycleStart = runway.cycleStart();
        LocalDate effectiveStart = cycleStart;
        if (user.getOpeningBalanceEffectiveDate() != null && user.getOpeningBalanceEffectiveDate().isAfter(cycleStart)) {
            effectiveStart = user.getOpeningBalanceEffectiveDate().plusDays(1);
        }

        BigDecimal totalExpenses;
        if (effectiveStart.isAfter(today)) {
            totalExpenses = BigDecimal.ZERO;
        } else {
            totalExpenses = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    currentUserId, TransactionType.EXPENSE, effectiveStart, today);
        }

        return spendingPaceCalculator.calculatePace(
                cycleStart,
                runway.cycleEnd(),
                today,
                totalExpenses,
                runway.availableCash(),
                runway.safeDailySpend(),
                runway.daysRemaining()
        );
    }

    @Transactional(readOnly = true)
    public CycleEndProjectionResponse getCycleEndProjection() {
        RunwaySummaryResponse runway = runwayCalculationService.getRunwaySummary();
        return cycleEndProjectionCalculator.calculateProjection(
                runway.liquidCash(),
                runway.protectedBills(),
                runway.cycleStart(),
                runway.cycleEnd(),
                runway.daysRemaining()
        );
    }

    @Transactional(readOnly = true)
    public DecisionSummaryResponse getDecisionSummary() {
        RunwaySummaryResponse runway = runwayCalculationService.getRunwaySummary();
        SpendingPaceResponse pace = getSpendingPace();
        CycleEndProjectionResponse projection = cycleEndProjectionCalculator.calculateProjection(
                runway.liquidCash(),
                runway.protectedBills(),
                runway.cycleStart(),
                runway.cycleEnd(),
                runway.daysRemaining()
        );
        return new DecisionSummaryResponse(runway, pace, projection);
    }
}
