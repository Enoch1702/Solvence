package com.solvence.service.runway;

import com.solvence.dto.RunwaySummaryResponse;
import com.solvence.entity.*;
import com.solvence.repository.RecurringObligationRepository;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RunwayCalculationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private RecurringObligationRepository recurringObligationRepository;

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
        CycleCalculator cycleCalculator = new CycleCalculator(fixedClock);
        BalanceCalculator balanceCalculator = new BalanceCalculator();
        RecurringObligationCalculator recurringCalculator = new RecurringObligationCalculator();
        SafeSpendCalculator safeSpendCalculator = new SafeSpendCalculator();

        runwayService = new RunwayCalculationService(
                userRepository,
                transactionRepository,
                recurringObligationRepository,
                currentUserProvider,
                cycleCalculator,
                balanceCalculator,
                recurringCalculator,
                safeSpendCalculator,
                fixedClock
        );
    }

    @Test
    void testEndToEndVerificationScenario() {
        // User Setup:
        // Opening Balance = ₹25,000, Hourly Rate = ₹300, cycle_start_day = 1
        User user = new User(
                1L,
                "Solvence User",
                "user@solvence.local",
                null,
                "INR",
                new BigDecimal("25000.00"),
                new BigDecimal("300.00"),
                1
        );

        when(currentUserProvider.getCurrentUserId()).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // Transactions: Income = ₹40,000, Expenses = ₹12,000
        when(transactionRepository.sumAmountByUserIdAndType(1L, TransactionType.INCOME))
                .thenReturn(new BigDecimal("40000.00"));
        when(transactionRepository.sumAmountByUserIdAndType(1L, TransactionType.EXPENSE))
                .thenReturn(new BigDecimal("12000.00"));

        // Recurring Obligation: Rent = ₹15,000 due day 20
        Category rentCategory = new Category(1L, null, "Rent", TransactionType.EXPENSE, true, "rent");
        RecurringObligation rent = new RecurringObligation(
                1L,
                user,
                rentCategory,
                "Apartment Rent",
                new BigDecimal("15000.00"),
                20,
                ObligationFrequency.MONTHLY,
                true
        );
        when(recurringObligationRepository.findByUserIdAndIsActiveTrue(1L))
                .thenReturn(List.of(rent));

        // Execute runway calculation for today = 2026-03-13
        RunwaySummaryResponse response = runwayService.getRunwaySummary();

        // 1. Liquid Reserve: ₹25,000 + ₹40,000 - ₹12,000 = ₹53,000
        assertEquals(new BigDecimal("53000.00"), response.liquidReserve());

        // 2. Committed Bills: ₹15,000
        assertEquals(new BigDecimal("15000.00"), response.committedBills());

        // 3. Available Cash: ₹53,000 - ₹15,000 = ₹38,000
        assertEquals(new BigDecimal("38000.00"), response.availableCash());

        // 4. Days Remaining: March has 31 days. March 13 to March 31 inclusive = 19 days
        assertEquals(19, response.daysRemaining());

        // 5. Safe Daily Spend: ₹38,000 / 19 = ₹2,000
        assertEquals(new BigDecimal("2000.00"), response.safeDailySpend());

        // 6. Verified Hourly Wage: ₹300
        assertEquals(new BigDecimal("300.00"), response.hourlyRate());
    }
}
