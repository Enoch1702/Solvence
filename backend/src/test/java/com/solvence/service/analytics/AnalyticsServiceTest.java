package com.solvence.service.analytics;

import com.solvence.dto.analytics.BurnTrajectoryPoint;
import com.solvence.dto.analytics.BurnTrajectoryResponse;
import com.solvence.dto.analytics.CashflowSummaryResponse;
import com.solvence.dto.analytics.CategoryBreakdownItem;
import com.solvence.entity.TransactionType;
import com.solvence.entity.User;
import com.solvence.repository.TransactionRepository;
import com.solvence.repository.UserRepository;
import com.solvence.security.CurrentUserProvider;
import com.solvence.service.runway.CycleCalculator;
import com.solvence.service.runway.PayCycle;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private CycleCalculator cycleCalculator;
    private Clock fixedClock;
    private AnalyticsService analyticsService;

    private User currentUser;
    private final LocalDate fixedToday = LocalDate.of(2026, 9, 7);

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2026-09-07T10:00:00Z"), ZoneId.of("UTC"));
        cycleCalculator = new CycleCalculator(fixedClock);

        analyticsService = new AnalyticsService(
                transactionRepository,
                userRepository,
                currentUserProvider,
                cycleCalculator,
                fixedClock
        );

        currentUser = new User(1L, "Test User", "test@solvence.local", "hash", "INR",
                new BigDecimal("25000.00"), new BigDecimal("300.00"), 1);

        when(currentUserProvider.getCurrentUserId()).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));
    }

    @Test
    void testBurnTrajectoryEndsAtTodayWithNoFutureDates() {
        // Cycle: Sept 1 to Sept 30. Today: Sept 7.
        // Expected trajectory points: Sept 1 through Sept 7 (7 points).
        // Database has transactions on Sept 2 (expense 500) and Sept 4 (expense 1500, income 3000)
        List<Object[]> rawDaily = List.of(
                new Object[]{LocalDate.of(2026, 9, 2), TransactionType.EXPENSE, new BigDecimal("500.00")},
                new Object[]{LocalDate.of(2026, 9, 4), TransactionType.EXPENSE, new BigDecimal("1500.00")},
                new Object[]{LocalDate.of(2026, 9, 4), TransactionType.INCOME, new BigDecimal("3000.00")}
        );

        when(transactionRepository.findDailyTotalsByUserIdAndDateBetween(
                1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 7)
        )).thenReturn(rawDaily);

        BurnTrajectoryResponse response = analyticsService.getBurnTrajectory();

        assertNotNull(response);
        assertEquals(LocalDate.of(2026, 9, 1), response.cycleStart());
        assertEquals(LocalDate.of(2026, 9, 30), response.cycleEnd());
        assertEquals(LocalDate.of(2026, 9, 7), response.asOfDate());

        List<BurnTrajectoryPoint> points = response.points();
        assertEquals(7, points.size(), "Must contain exactly 7 days (Sept 1 to Sept 7)");

        // Verify bounds: no future dates beyond Sept 7
        assertEquals(LocalDate.of(2026, 9, 1), points.get(0).date());
        assertEquals(LocalDate.of(2026, 9, 7), points.get(6).date());

        // Day 1 (Sept 1) - zero value
        BurnTrajectoryPoint day1 = points.get(0);
        assertEquals(new BigDecimal("0"), day1.dailyExpenses());
        assertEquals(new BigDecimal("0"), day1.cumulativeExpenses());
        assertEquals(new BigDecimal("0"), day1.dailyIncome());
        assertEquals(new BigDecimal("0"), day1.cumulativeIncome());
        assertEquals(new BigDecimal("0"), day1.netCashflow());

        // Day 2 (Sept 2) - expense 500
        BurnTrajectoryPoint day2 = points.get(1);
        assertEquals(new BigDecimal("500.00"), day2.dailyExpenses());
        assertEquals(new BigDecimal("500.00"), day2.cumulativeExpenses());
        assertEquals(new BigDecimal("0"), day2.dailyIncome());
        assertEquals(new BigDecimal("0"), day2.cumulativeIncome());
        assertEquals(new BigDecimal("-500.00"), day2.netCashflow());

        // Day 3 (Sept 3) - zero spend, cumulative preserved
        BurnTrajectoryPoint day3 = points.get(2);
        assertEquals(new BigDecimal("0"), day3.dailyExpenses());
        assertEquals(new BigDecimal("500.00"), day3.cumulativeExpenses());

        // Day 4 (Sept 4) - expense 1500, income 3000
        BurnTrajectoryPoint day4 = points.get(3);
        assertEquals(new BigDecimal("1500.00"), day4.dailyExpenses());
        assertEquals(new BigDecimal("2000.00"), day4.cumulativeExpenses());
        assertEquals(new BigDecimal("3000.00"), day4.dailyIncome());
        assertEquals(new BigDecimal("3000.00"), day4.cumulativeIncome());
        assertEquals(new BigDecimal("1500.00"), day4.netCashflow());

        // Day 7 (Sept 7) - final cumulative
        BurnTrajectoryPoint day7 = points.get(6);
        assertEquals(new BigDecimal("2000.00"), day7.cumulativeExpenses());
        assertEquals(new BigDecimal("3000.00"), day7.cumulativeIncome());
    }

    @Test
    void testBurnTrajectoryEmptyHistory() {
        when(transactionRepository.findDailyTotalsByUserIdAndDateBetween(
                1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 7)
        )).thenReturn(Collections.emptyList());

        BurnTrajectoryResponse response = analyticsService.getBurnTrajectory();

        assertEquals(7, response.points().size());
        for (BurnTrajectoryPoint point : response.points()) {
            assertEquals(BigDecimal.ZERO, point.dailyExpenses());
            assertEquals(BigDecimal.ZERO, point.cumulativeExpenses());
            assertEquals(BigDecimal.ZERO, point.dailyIncome());
            assertEquals(BigDecimal.ZERO, point.cumulativeIncome());
            assertEquals(BigDecimal.ZERO, point.netCashflow());
        }
    }

    @Test
    void testCategoryBreakdownCalculationsWithScaleTwoAndHalfUp() {
        // Food: 450.00, Rent: 1500.00, Transport: 200.00 -> Total = 2150.00
        // Percentages:
        // Rent: 1500 * 100 / 2150 = 69.7674... -> 69.77%
        // Food: 450 * 100 / 2150 = 20.9302... -> 20.93%
        // Transport: 200 * 100 / 2150 = 9.3023... -> 9.30%
        List<Object[]> rawCategories = List.of(
                new Object[]{10L, "Rent", new BigDecimal("1500.00")},
                new Object[]{11L, "Food", new BigDecimal("450.00")},
                new Object[]{12L, "Transport", new BigDecimal("200.00")}
        );

        when(transactionRepository.findCategoryTotalsByUserIdAndTypeAndDateBetween(
                1L, TransactionType.EXPENSE, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)
        )).thenReturn(rawCategories);

        List<CategoryBreakdownItem> result = analyticsService.getCategoryBreakdown();

        assertEquals(3, result.size());

        CategoryBreakdownItem rent = result.get(0);
        assertEquals(10L, rent.categoryId());
        assertEquals("Rent", rent.categoryName());
        assertEquals(new BigDecimal("1500.00"), rent.amount());
        assertEquals(new BigDecimal("69.77"), rent.percentage());
        assertEquals(2, rent.percentage().scale());

        CategoryBreakdownItem food = result.get(1);
        assertEquals(11L, food.categoryId());
        assertEquals("Food", food.categoryName());
        assertEquals(new BigDecimal("450.00"), food.amount());
        assertEquals(new BigDecimal("20.93"), food.percentage());
        assertEquals(2, food.percentage().scale());

        CategoryBreakdownItem transport = result.get(2);
        assertEquals(12L, transport.categoryId());
        assertEquals("Transport", transport.categoryName());
        assertEquals(new BigDecimal("200.00"), transport.amount());
        assertEquals(new BigDecimal("9.30"), transport.percentage());
        assertEquals(2, transport.percentage().scale());
    }

    @Test
    void testCategoryBreakdownZeroExpenseCycleReturnsEmptyList() {
        when(transactionRepository.findCategoryTotalsByUserIdAndTypeAndDateBetween(
                1L, TransactionType.EXPENSE, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)
        )).thenReturn(Collections.emptyList());

        List<CategoryBreakdownItem> result = analyticsService.getCategoryBreakdown();

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testCashflowSummaryCalculations() {
        List<Object[]> rawTotals = List.of(
                new Object[]{TransactionType.INCOME, new BigDecimal("50000.00"), 2L},
                new Object[]{TransactionType.EXPENSE, new BigDecimal("12500.00"), 5L}
        );

        when(transactionRepository.findCashflowTotalsByUserIdAndDateBetween(
                1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)
        )).thenReturn(rawTotals);

        CashflowSummaryResponse response = analyticsService.getCashflowSummary();

        assertNotNull(response);
        assertEquals(new BigDecimal("50000.00"), response.totalIncome());
        assertEquals(new BigDecimal("12500.00"), response.totalExpenses());
        assertEquals(new BigDecimal("37500.00"), response.netCashflow());
        assertEquals(7L, response.transactionCount());
        assertEquals(LocalDate.of(2026, 9, 1), response.cycleStart());
        assertEquals(LocalDate.of(2026, 9, 30), response.cycleEnd());
    }

    @Test
    void testCashflowSummaryEmptyHistory() {
        when(transactionRepository.findCashflowTotalsByUserIdAndDateBetween(
                1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)
        )).thenReturn(Collections.emptyList());

        CashflowSummaryResponse response = analyticsService.getCashflowSummary();

        assertNotNull(response);
        assertEquals(BigDecimal.ZERO, response.totalIncome());
        assertEquals(BigDecimal.ZERO, response.totalExpenses());
        assertEquals(BigDecimal.ZERO, response.netCashflow());
        assertEquals(0L, response.transactionCount());
    }
}
