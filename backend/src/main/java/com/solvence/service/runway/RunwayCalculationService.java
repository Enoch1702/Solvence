package com.solvence.service.runway;

import com.solvence.dto.RunwaySummaryResponse;
import com.solvence.entity.OccurrenceStatus;
import com.solvence.entity.TransactionType;
import com.solvence.entity.User;
import com.solvence.exception.ResourceNotFoundException;
import com.solvence.repository.ObligationOccurrenceRepository;
import com.solvence.repository.TransactionRepository;
import com.solvence.repository.UserRepository;
import com.solvence.security.CurrentUserProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
public class RunwayCalculationService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final ObligationOccurrenceRepository obligationOccurrenceRepository;
    private final OccurrenceGenerationService occurrenceGenerationService;
    private final CurrentUserProvider currentUserProvider;
    private final PayCycleEngine payCycleEngine;
    private final BalanceCalculator balanceCalculator;
    private final SafeSpendCalculator safeSpendCalculator;
    private final Clock clock;

    public RunwayCalculationService(UserRepository userRepository,
                                   TransactionRepository transactionRepository,
                                   ObligationOccurrenceRepository obligationOccurrenceRepository,
                                   OccurrenceGenerationService occurrenceGenerationService,
                                   CurrentUserProvider currentUserProvider,
                                   PayCycleEngine payCycleEngine,
                                   BalanceCalculator balanceCalculator,
                                   SafeSpendCalculator safeSpendCalculator,
                                   Clock clock) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.obligationOccurrenceRepository = obligationOccurrenceRepository;
        this.occurrenceGenerationService = occurrenceGenerationService;
        this.currentUserProvider = currentUserProvider;
        this.payCycleEngine = payCycleEngine;
        this.balanceCalculator = balanceCalculator;
        this.safeSpendCalculator = safeSpendCalculator;
        this.clock = clock;
    }

    @Transactional
    public RunwaySummaryResponse getRunwaySummary() {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        LocalDate today = LocalDate.now(clock);
        return calculateSummaryForDate(user, today);
    }

    /**
     * Deterministic calculation method testable for arbitrary dates.
     */
    public RunwaySummaryResponse calculateSummaryForDate(User user, LocalDate today) {
        Long userId = user.getId();

        // 1. Transaction aggregations (bounded by opening balance effective date and as-of today)
        LocalDate effectiveDate = user.getOpeningBalanceEffectiveDate();
        BigDecimal totalIncome;
        BigDecimal totalExpenses;

        if (effectiveDate != null) {
            totalIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                    userId, TransactionType.INCOME, effectiveDate, today);
            totalExpenses = transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                    userId, TransactionType.EXPENSE, effectiveDate, today);
        } else {
            totalIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBeforeEqual(
                    userId, TransactionType.INCOME, today);
            totalExpenses = transactionRepository.sumAmountByUserIdAndTypeAndDateBeforeEqual(
                    userId, TransactionType.EXPENSE, today);
        }

        // 2. Current Liquid Cash
        BigDecimal liquidCash = balanceCalculator.calculateLiquidReserve(
                user.getOpeningBalance(),
                totalIncome,
                totalExpenses
        );

        // 3. Pay Cycle calculation
        PayCycle cycle = payCycleEngine.calculateCycle(user, today);

        // 4. Generate/sync occurrences for current cycle
        occurrenceGenerationService.generateOccurrencesForCycle(user, cycle.startDate(), cycle.endDate(), today);

        // 5. Protected Bills (sum of PENDING and OVERDUE occurrences for cycle)
        BigDecimal protectedBills = obligationOccurrenceRepository.sumAmountByUserIdAndCycleAndStatusIn(
                userId,
                cycle.startDate(),
                List.of(OccurrenceStatus.PENDING, OccurrenceStatus.OVERDUE)
        );

        // 6. Available Cash & Safe Daily Spend
        SafeSpendResult safeSpend = safeSpendCalculator.calculateSafeSpend(
                liquidCash,
                protectedBills,
                cycle.daysRemaining()
        );

        return new RunwaySummaryResponse(
                liquidCash,
                protectedBills,
                safeSpend.availableCash(),
                safeSpend.safeDailySpend(),
                cycle.daysRemaining(),
                user.getHourlyRate(),
                cycle.startDate(),
                cycle.endDate(),
                user.getOpeningBalance(),
                totalIncome,
                totalExpenses,
                liquidCash,
                protectedBills,
                safeSpend.isDeficit(),
                safeSpend.deficitAmount()
        );
    }
}
