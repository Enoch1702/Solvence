package com.solvence.service.decision;

import com.solvence.dto.RunwaySummaryResponse;
import com.solvence.dto.SpendDecisionRequest;
import com.solvence.dto.SpendDecisionResponse;
import com.solvence.entity.PayCycleType;
import com.solvence.entity.User;
import com.solvence.model.decision.DecisionStatus;
import com.solvence.repository.TransactionRepository;
import com.solvence.repository.UserRepository;
import com.solvence.security.CurrentUserProvider;
import com.solvence.service.runway.LifeHourCalculator;
import com.solvence.service.runway.RunwayCalculationService;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DecisionEngineBenchmarkTest {

    @Mock
    private CurrentUserProvider currentUserProvider;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RunwayCalculationService runwayCalculationService;

    @Mock
    private TransactionRepository transactionRepository;

    private DecisionEngineService decisionEngineService;

    private final LocalDate evaluationDate = LocalDate.of(2026, 3, 13);
    private final Clock fixedClock = Clock.fixed(
            evaluationDate.atStartOfDay(ZoneId.of("UTC")).toInstant(),
            ZoneId.of("UTC")
    );

    private User benchmarkUser;
    private RunwaySummaryResponse benchmarkRunway;

    @BeforeEach
    void setUp() {
        LifeHourCalculator lifeHourCalculator = new LifeHourCalculator();
        DecisionCalculationService decisionCalculationService = new DecisionCalculationService(lifeHourCalculator);
        SpendingPaceCalculator spendingPaceCalculator = new SpendingPaceCalculator();
        CycleEndProjectionCalculator cycleEndProjectionCalculator = new CycleEndProjectionCalculator();

        decisionEngineService = new DecisionEngineService(
                currentUserProvider,
                userRepository,
                runwayCalculationService,
                transactionRepository,
                decisionCalculationService,
                spendingPaceCalculator,
                cycleEndProjectionCalculator,
                fixedClock
        );

        // Benchmark Setup (Section 20):
        // Opening Balance = ₹25,000, Hourly Rate = ₹300, cycle start = 1
        // Income = ₹40,000, Expenses = ₹12,000, Rent = ₹15,000
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

        // Total Balance: ₹53,000.00, Protected Bills: ₹15,000.00, Spending Money: ₹38,000.00
        // Days Remaining: 19, Safe Daily Spend: ₹2,000.00
        benchmarkRunway = new RunwaySummaryResponse(
                new BigDecimal("53000.00"),
                new BigDecimal("15000.00"),
                new BigDecimal("38000.00"),
                new BigDecimal("2000.00"),
                19,
                new BigDecimal("300.00"),
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 31),
                new BigDecimal("25000.00"),
                new BigDecimal("40000.00"),
                new BigDecimal("12000.00"),
                new BigDecimal("53000.00"),
                new BigDecimal("15000.00"),
                false,
                new BigDecimal("0.00")
        );

        lenient().when(currentUserProvider.getCurrentUserId()).thenReturn(1L);
        lenient().when(userRepository.findById(1L)).thenReturn(Optional.of(benchmarkUser));
        lenient().when(runwayCalculationService.getRunwaySummary()).thenReturn(benchmarkRunway);
    }

    @Test
    @DisplayName("Section 20.1: Proposed expense of ₹750 returns SAFE, ₹1,960.53/day, 2.5h labor cost")
    void testBenchmarkScenario750Spend() {
        SpendDecisionRequest request = new SpendDecisionRequest(new BigDecimal("750.00"));

        SpendDecisionResponse response = decisionEngineService.evaluateSpend(request);

        assertEquals(DecisionStatus.SAFE, response.decision());
        assertEquals(new BigDecimal("750.00"), response.amount());
        assertEquals(new BigDecimal("53000.00"), response.totalBalance());
        assertEquals(new BigDecimal("15000.00"), response.protectedBills());
        assertEquals(new BigDecimal("38000.00"), response.spendingMoney());
        assertEquals(new BigDecimal("2000.00"), response.safeToSpendToday());
        assertEquals(19, response.daysRemaining());

        // Hypothetical calculations:
        assertEquals(new BigDecimal("37250.00"), response.hypotheticalSpendingMoney());
        // 37,250 / 19 = 1,960.526... -> 1,960.53
        assertEquals(new BigDecimal("1960.53"), response.hypotheticalSafeToSpendToday());
        // Labor cost: 750 / 300 = 2.5 hours
        assertEquals(new BigDecimal("2.5"), response.laborCostHours());
        assertFalse(response.isDeficit());
        assertEquals(new BigDecimal("0.00"), response.deficitAmount());
        assertEquals("This fits within today's safe spending amount.", response.message());

        // Assert NO database mutation occurred
        verify(transactionRepository, never()).save(any());
        verify(transactionRepository, never()).delete(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Section 20.2: Proposed expense of ₹3,000 returns CAUTION (₹3,000 > ₹2,000 today but non-negative)")
    void testBenchmarkScenario3000Spend() {
        SpendDecisionRequest request = new SpendDecisionRequest(new BigDecimal("3000.00"));

        SpendDecisionResponse response = decisionEngineService.evaluateSpend(request);

        assertEquals(DecisionStatus.CAUTION, response.decision());
        assertEquals(new BigDecimal("3000.00"), response.amount());
        assertEquals(new BigDecimal("35000.00"), response.hypotheticalSpendingMoney());
        // 35,000 / 19 = 1,842.105... -> 1,842.11
        assertEquals(new BigDecimal("1842.11"), response.hypotheticalSafeToSpendToday());
        // Labor cost: 3,000 / 300 = 10.0 hours
        assertEquals(new BigDecimal("10.0"), response.laborCostHours());
        assertFalse(response.isDeficit());
        assertEquals("You can cover this from current spending money, but it is above today's safe amount.", response.message());

        // Assert NO database mutation occurred
        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Section 20.3: Proposed expense of ₹40,000 returns NOT_SAFE (deficit of ₹2,000)")
    void testBenchmarkScenario40000Spend() {
        SpendDecisionRequest request = new SpendDecisionRequest(new BigDecimal("40000.00"));

        SpendDecisionResponse response = decisionEngineService.evaluateSpend(request);

        assertEquals(DecisionStatus.NOT_SAFE, response.decision());
        assertEquals(new BigDecimal("40000.00"), response.amount());
        assertEquals(new BigDecimal("-2000.00"), response.hypotheticalSpendingMoney());
        assertEquals(new BigDecimal("0.00"), response.hypotheticalSafeToSpendToday());
        assertTrue(response.isDeficit());
        assertEquals(new BigDecimal("2000.00"), response.deficitAmount());
        assertEquals("This would put your spending money below zero after protected bills.", response.message());

        // Assert NO database mutation occurred
        verify(transactionRepository, never()).save(any());
    }
}
