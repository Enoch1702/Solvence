package com.solvence.service.runway;

import com.solvence.dto.RunwaySummaryResponse;
import com.solvence.entity.RecurringObligation;
import com.solvence.entity.TransactionType;
import com.solvence.entity.User;
import com.solvence.exception.ResourceNotFoundException;
import com.solvence.repository.RecurringObligationRepository;
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
    private final RecurringObligationRepository recurringObligationRepository;
    private final CurrentUserProvider currentUserProvider;
    private final CycleCalculator cycleCalculator;
    private final BalanceCalculator balanceCalculator;
    private final RecurringObligationCalculator recurringObligationCalculator;
    private final SafeSpendCalculator safeSpendCalculator;
    private final Clock clock;

    public RunwayCalculationService(UserRepository userRepository,
                                   TransactionRepository transactionRepository,
                                   RecurringObligationRepository recurringObligationRepository,
                                   CurrentUserProvider currentUserProvider,
                                   CycleCalculator cycleCalculator,
                                   BalanceCalculator balanceCalculator,
                                   RecurringObligationCalculator recurringObligationCalculator,
                                   SafeSpendCalculator safeSpendCalculator,
                                   Clock clock) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.recurringObligationRepository = recurringObligationRepository;
        this.currentUserProvider = currentUserProvider;
        this.cycleCalculator = cycleCalculator;
        this.balanceCalculator = balanceCalculator;
        this.recurringObligationCalculator = recurringObligationCalculator;
        this.safeSpendCalculator = safeSpendCalculator;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
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

        // 1. Transaction aggregations
        BigDecimal totalIncome = transactionRepository.sumAmountByUserIdAndType(userId, TransactionType.INCOME);
        BigDecimal totalExpenses = transactionRepository.sumAmountByUserIdAndType(userId, TransactionType.EXPENSE);

        // 2. Liquid Reserve
        BigDecimal liquidReserve = balanceCalculator.calculateLiquidReserve(
                user.getOpeningBalance(),
                totalIncome,
                totalExpenses
        );

        // 3. Cycle calculation
        PayCycle cycle = cycleCalculator.calculateCycle(today, user.getCycleStartDay());

        // 4. Committed Bills (active obligations in remaining cycle)
        List<RecurringObligation> activeObligations = recurringObligationRepository.findByUserIdAndIsActiveTrue(userId);
        BigDecimal committedBills = recurringObligationCalculator.calculateCommittedBills(
                activeObligations,
                today,
                cycle.startDate(),
                cycle.endDate()
        );

        // 5. Available Cash & Safe Daily Spend
        SafeSpendResult safeSpend = safeSpendCalculator.calculateSafeSpend(
                liquidReserve,
                committedBills,
                cycle.daysRemaining()
        );

        return new RunwaySummaryResponse(
                liquidReserve,
                committedBills,
                safeSpend.availableCash(),
                safeSpend.safeDailySpend(),
                cycle.daysRemaining(),
                user.getHourlyRate(),
                cycle.startDate(),
                cycle.endDate(),
                user.getOpeningBalance(),
                totalIncome,
                totalExpenses
        );
    }
}
