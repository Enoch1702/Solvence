package com.solvence.service.runway;

import com.solvence.dto.RunwaySummaryResponse;
import com.solvence.entity.PayCycleType;
import com.solvence.entity.TransactionType;
import com.solvence.entity.User;
import com.solvence.repository.ObligationOccurrenceRepository;
import com.solvence.repository.TransactionRepository;
import com.solvence.repository.UserRepository;
import com.solvence.security.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RunwayCalculationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private ObligationOccurrenceRepository obligationOccurrenceRepository;

    @Mock
    private OccurrenceGenerationService occurrenceGenerationService;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private RunwayCalculationService runwayService;

    private final LocalDate testDate = LocalDate.of(2026, 3, 13);
    private final Clock fixedClock = Clock.fixed(
            testDate.atStartOfDay(ZoneId.of("UTC")).toInstant(),
            ZoneId.of("UTC")
    );

    @BeforeEach
    void setUp() {
        PayCycleEngine payCycleEngine = new PayCycleEngine(fixedClock);
        BalanceCalculator balanceCalculator = new BalanceCalculator();
        SafeSpendCalculator safeSpendCalculator = new SafeSpendCalculator();

        runwayService = new RunwayCalculationService(
                userRepository,
                transactionRepository,
                obligationOccurrenceRepository,
                occurrenceGenerationService,
                currentUserProvider,
                payCycleEngine,
                balanceCalculator,
                safeSpendCalculator,
                fixedClock
        );
    }

    @Test
    void testEndToEndVerificationScenario() {
        // User Setup:
        // Opening Balance = ₹25,000, Hourly Rate = ₹300, cycle_start_day = 1, effective date = 2026-03-01
        User user = new User(
                1L,
                "Solvence User",
                "user@solvence.local",
                null,
                "INR",
                new BigDecimal("25000.00"),
                LocalDate.of(2026, 3, 1),
                new BigDecimal("300.00"),
                PayCycleType.MONTHLY,
                1,
                null,
                null
        );

        when(currentUserProvider.getCurrentUserId()).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // As-of-date Transactions: Income = ₹40,000, Expenses = ₹12,000
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(1L, TransactionType.INCOME, user.getOpeningBalanceEffectiveDate(), testDate))
                .thenReturn(new BigDecimal("40000.00"));
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(1L, TransactionType.EXPENSE, user.getOpeningBalanceEffectiveDate(), testDate))
                .thenReturn(new BigDecimal("12000.00"));

        // Protected Bills from Occurrences: ₹15,000
        when(obligationOccurrenceRepository.sumAmountByUserIdAndCycleAndStatusIn(eq(1L), eq(LocalDate.of(2026, 3, 1)), any()))
                .thenReturn(new BigDecimal("15000.00"));

        // Execute runway calculation for today = 2026-03-13
        RunwaySummaryResponse response = runwayService.getRunwaySummary();

        // 1. Liquid Cash / Reserve: ₹25,000 + ₹40,000 - ₹12,000 = ₹53,000
        assertEquals(new BigDecimal("53000.00"), response.liquidCash());
        assertEquals(new BigDecimal("53000.00"), response.liquidReserve());

        // 2. Protected / Committed Bills: ₹15,000
        assertEquals(new BigDecimal("15000.00"), response.protectedBills());
        assertEquals(new BigDecimal("15000.00"), response.committedBills());

        // 3. Available Cash: ₹53,000 - ₹15,000 = ₹38,000
        assertEquals(new BigDecimal("38000.00"), response.availableCash());

        // 4. Days Remaining: March 13 to March 31 inclusive = 19 days
        assertEquals(19, response.daysRemaining());

        // 5. Safe Daily Spend: ₹38,000 / 19 = ₹2,000
        assertEquals(new BigDecimal("2000.00"), response.safeDailySpend());

        // 6. Verified Hourly Wage: ₹300
        assertEquals(new BigDecimal("300.00"), response.hourlyRate());

        // 7. Deficit flags
        assertFalse(response.isDeficit());
        assertEquals(new BigDecimal("0.00"), response.deficitAmount());

        // Verify occurrence generation was invoked
        verify(occurrenceGenerationService).generateOccurrencesForCycle(user, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31), testDate);
    }

    @Test
    void testDeficitScenario() {
        User user = new User(
                1L,
                "Solvence User",
                "user@solvence.local",
                null,
                "INR",
                new BigDecimal("5000.00"),
                LocalDate.of(2026, 3, 1),
                new BigDecimal("300.00"),
                PayCycleType.MONTHLY,
                1,
                null,
                null
        );

        when(currentUserProvider.getCurrentUserId()).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        when(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(1L, TransactionType.INCOME, user.getOpeningBalanceEffectiveDate(), testDate))
                .thenReturn(BigDecimal.ZERO);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(1L, TransactionType.EXPENSE, user.getOpeningBalanceEffectiveDate(), testDate))
                .thenReturn(BigDecimal.ZERO);

        // Protected Bills: ₹15,000 (exceeds liquid cash of ₹5,000)
        when(obligationOccurrenceRepository.sumAmountByUserIdAndCycleAndStatusIn(eq(1L), eq(LocalDate.of(2026, 3, 1)), any()))
                .thenReturn(new BigDecimal("15000.00"));

        RunwaySummaryResponse response = runwayService.getRunwaySummary();

        // Available cash: 5000 - 15000 = -10000
        assertEquals(new BigDecimal("-10000.00"), response.availableCash());
        assertEquals(new BigDecimal("0.00"), response.safeDailySpend());
        assertTrue(response.isDeficit());
        assertEquals(new BigDecimal("10000.00"), response.deficitAmount());
    }
}
