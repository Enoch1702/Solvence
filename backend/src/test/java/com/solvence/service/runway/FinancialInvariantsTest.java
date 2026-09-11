package com.solvence.service.runway;

import com.solvence.dto.RunwaySummaryResponse;
import com.solvence.entity.*;
import com.solvence.repository.ObligationOccurrenceRepository;
import com.solvence.repository.TransactionRepository;
import com.solvence.repository.UserRepository;
import com.solvence.security.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinancialInvariantsTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private ObligationOccurrenceRepository occurrenceRepository;

    @Mock
    private OccurrenceGenerationService occurrenceGenerationService;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private RunwayCalculationService runwayService;
    private SafeSpendCalculator safeSpendCalculator;
    private PayCycleEngine payCycleEngine;
    private BalanceCalculator balanceCalculator;

    private final LocalDate benchmarkToday = LocalDate.of(2026, 3, 13);
    private final Clock fixedClock = Clock.fixed(
            benchmarkToday.atStartOfDay(ZoneId.of("UTC")).toInstant(),
            ZoneId.of("UTC")
    );

    private User benchmarkUser;

    @BeforeEach
    void setUp() {
        payCycleEngine = new PayCycleEngine(fixedClock);
        balanceCalculator = new BalanceCalculator();
        safeSpendCalculator = new SafeSpendCalculator();

        runwayService = new RunwayCalculationService(
                userRepository,
                transactionRepository,
                occurrenceRepository,
                occurrenceGenerationService,
                currentUserProvider,
                payCycleEngine,
                balanceCalculator,
                safeSpendCalculator,
                fixedClock
        );

        benchmarkUser = new User(
                1L,
                "Benchmark User",
                "bench@solvence.local",
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

        lenient().when(currentUserProvider.getCurrentUserId()).thenReturn(1L);
        lenient().when(userRepository.findById(1L)).thenReturn(Optional.of(benchmarkUser));
    }

    @Test
    @DisplayName("INV-01 & Section 36 Benchmark Scenario: As-of-date cash isolation and no double deduction")
    void testSection36BenchmarkScenario() {
        // As of 2026-03-13:
        // Opening balance: ₹25,000 (effective 2026-03-01)
        // Income: ₹40,000 (2026-03-05)
        // Expenses: ₹12,000 (2026-03-10)
        // Rent: ₹15,000 due 2026-03-20 (PENDING)
        // Future Income on 2026-03-25: ₹50,000 (MUST NOT be in liquid cash queries)

        when(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(1L, TransactionType.INCOME, benchmarkUser.getOpeningBalanceEffectiveDate(), benchmarkToday))
                .thenReturn(new BigDecimal("40000.00"));
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(1L, TransactionType.EXPENSE, benchmarkUser.getOpeningBalanceEffectiveDate(), benchmarkToday))
                .thenReturn(new BigDecimal("12000.00"));

        when(occurrenceRepository.sumAmountByUserIdAndCycleAndStatusIn(eq(1L), eq(LocalDate.of(2026, 3, 1)), any()))
                .thenReturn(new BigDecimal("15000.00"));

        RunwaySummaryResponse r1 = runwayService.getRunwaySummary();

        // Mathematical Assertions at Step 1:
        // Liquid Cash = 25,000 + 40,000 - 12,000 = 53,000
        assertEquals(new BigDecimal("53000.00"), r1.liquidCash());
        // Protected Bills = 15,000
        assertEquals(new BigDecimal("15000.00"), r1.protectedBills());
        // Available Cash = 53,000 - 15,000 = 38,000
        assertEquals(new BigDecimal("38000.00"), r1.availableCash());
        // Days Remaining = March 13 to 31 = 19 days
        assertEquals(19, r1.daysRemaining());
        // Safe Daily Spend = 38,000 / 19 = 2,000.00
        assertEquals(new BigDecimal("2000.00"), r1.safeDailySpend());
        assertFalse(r1.isDeficit());
        assertEquals(new BigDecimal("0.00"), r1.deficitAmount());

        // Step 2: Now Rent is PAID on 2026-03-15
        // On 2026-03-15:
        // Expenses increase by ₹15,000 (from 12,000 to 27,000)
        // Protected bills decrease from ₹15,000 to ₹0.00 (since Rent occurrence status is now PAID)
        LocalDate day15 = LocalDate.of(2026, 3, 15);
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(1L, TransactionType.INCOME, benchmarkUser.getOpeningBalanceEffectiveDate(), day15))
                .thenReturn(new BigDecimal("40000.00"));
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(1L, TransactionType.EXPENSE, benchmarkUser.getOpeningBalanceEffectiveDate(), day15))
                .thenReturn(new BigDecimal("27000.00"));
        when(occurrenceRepository.sumAmountByUserIdAndCycleAndStatusIn(eq(1L), eq(LocalDate.of(2026, 3, 1)), any()))
                .thenReturn(new BigDecimal("0.00"));

        RunwaySummaryResponse r2 = runwayService.calculateSummaryForDate(benchmarkUser, day15);

        // Assertions at Step 2:
        // Liquid Cash drops to 38,000
        assertEquals(new BigDecimal("38000.00"), r2.liquidCash());
        // Protected Bills is 0 (PAID occurrence excluded)
        assertEquals(new BigDecimal("0.00"), r2.protectedBills());
        // Available Cash remains 38,000! NO DOUBLE DEDUCTION!
        assertEquals(new BigDecimal("38000.00"), r2.availableCash());
        // Days Remaining = March 15 to 31 = 17 days
        assertEquals(17, r2.daysRemaining());
        // Safe Daily Spend = 38,000 / 17 = 2,235.29
        assertEquals(new BigDecimal("2235.29"), r2.safeDailySpend());
    }

    @Test
    @DisplayName("INV-08 & INV-09: Negative Available Cash exposes deficit and clamps safeDailySpend to zero")
    void testDeficitInvariant() {
        SafeSpendResult result = safeSpendCalculator.calculateSafeSpend(
                new BigDecimal("1000.00"),
                new BigDecimal("5000.00"),
                10
        );

        // Available Cash: 1000 - 5000 = -4000 (retained, NOT clamped to zero)
        assertEquals(new BigDecimal("-4000.00"), result.availableCash());
        // Safe Daily Spend must be clamped to zero
        assertEquals(new BigDecimal("0.00"), result.safeDailySpend());
        assertTrue(result.isDeficit());
        assertEquals(new BigDecimal("4000.00"), result.deficitAmount());
    }

    @Test
    @DisplayName("INV-10: Division by Zero & Expiry Handling")
    void testDaysRemainingZeroOrNegative() {
        // When cash is positive and daysRemaining is 0, full remaining cash is spendable today
        SafeSpendResult resultZero = safeSpendCalculator.calculateSafeSpend(
                new BigDecimal("5000.00"),
                new BigDecimal("1000.00"),
                0
        );
        assertEquals(new BigDecimal("4000.00"), resultZero.availableCash());
        assertEquals(new BigDecimal("4000.00"), resultZero.safeDailySpend());

        // When cash is negative and daysRemaining is <= 0, safe spend is 0.00
        SafeSpendResult resultNeg = safeSpendCalculator.calculateSafeSpend(
                new BigDecimal("1000.00"),
                new BigDecimal("5000.00"),
                0
        );
        assertEquals(new BigDecimal("-4000.00"), resultNeg.availableCash());
        assertEquals(new BigDecimal("0.00"), resultNeg.safeDailySpend());
        assertTrue(resultNeg.isDeficit());
    }

    @Test
    @DisplayName("INV-12: Opening Balance Effective Date: transactions on or before effective date are excluded")
    void testOpeningBalanceEffectiveDateExclusion() {
        // Transactions range query uses `> fromDateExclusive AND <= toDateInclusive`
        LocalDate effectiveDate = LocalDate.of(2026, 3, 1);
        benchmarkUser.setOpeningBalanceEffectiveDate(effectiveDate);

        when(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(1L, TransactionType.INCOME, effectiveDate, benchmarkToday))
                .thenReturn(new BigDecimal("1000.00"));
        when(transactionRepository.sumAmountByUserIdAndTypeAndDateRange(1L, TransactionType.EXPENSE, effectiveDate, benchmarkToday))
                .thenReturn(new BigDecimal("500.00"));
        when(occurrenceRepository.sumAmountByUserIdAndCycleAndStatusIn(any(), any(), any()))
                .thenReturn(new BigDecimal("0.00"));

        RunwaySummaryResponse response = runwayService.getRunwaySummary();
        // 25000 + 1000 - 500 = 25500
        assertEquals(new BigDecimal("25500.00"), response.liquidCash());
    }
}
