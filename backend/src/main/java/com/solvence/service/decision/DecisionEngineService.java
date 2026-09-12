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
        RunwaySummaryResponse runway = runwayCalculationService.getRunwaySummary();
        return getSpendingPace(runway);
    }

    public SpendingPaceResponse getSpendingPace(RunwaySummaryResponse runway) {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        LocalDate today = LocalDate.now(clock);

        LocalDate cycleStart = runway.cycleStart();
        BigDecimal totalExpenses;
        if (cycleStart == null || today.isBefore(cycleStart)) {
            totalExpenses = BigDecimal.ZERO;
        } else {
            LocalDate queryEnd = runway.cycleEnd() != null && today.isAfter(runway.cycleEnd())
                    ? runway.cycleEnd()
                    : today;
            totalExpenses = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    currentUserId, TransactionType.EXPENSE, cycleStart, queryEnd);
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
        return getCycleEndProjection(runway);
    }

    public CycleEndProjectionResponse getCycleEndProjection(RunwaySummaryResponse runway) {
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
        SpendingPaceResponse pace = getSpendingPace(runway);
        CycleEndProjectionResponse projection = getCycleEndProjection(runway);
        return new DecisionSummaryResponse(runway, pace, projection);
    }
}
