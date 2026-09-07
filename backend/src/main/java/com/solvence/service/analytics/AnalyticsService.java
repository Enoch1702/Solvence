package com.solvence.service.analytics;

import com.solvence.dto.analytics.BurnTrajectoryPoint;
import com.solvence.dto.analytics.BurnTrajectoryResponse;
import com.solvence.dto.analytics.CashflowSummaryResponse;
import com.solvence.dto.analytics.CategoryBreakdownItem;
import com.solvence.entity.TransactionType;
import com.solvence.entity.User;
import com.solvence.exception.ResourceNotFoundException;
import com.solvence.repository.TransactionRepository;
import com.solvence.repository.UserRepository;
import com.solvence.security.CurrentUserProvider;
import com.solvence.service.runway.CycleCalculator;
import com.solvence.service.runway.PayCycle;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.*;

@Service
public class AnalyticsService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;
    private final CycleCalculator cycleCalculator;
    private final Clock clock;

    public AnalyticsService(TransactionRepository transactionRepository,
                            UserRepository userRepository,
                            CurrentUserProvider currentUserProvider,
                            CycleCalculator cycleCalculator,
                            Clock clock) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.currentUserProvider = currentUserProvider;
        this.cycleCalculator = cycleCalculator;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public BurnTrajectoryResponse getBurnTrajectory() {
        Long userId = currentUserProvider.getCurrentUserId();
        User user = getUser(userId);

        LocalDate today = LocalDate.now(clock);
        PayCycle cycle = cycleCalculator.calculateCycle(today, user.getCycleStartDay());

        LocalDate asOfDate = today.isBefore(cycle.endDate()) ? today : cycle.endDate();

        List<Object[]> rawDaily = transactionRepository.findDailyTotalsByUserIdAndDateBetween(
                userId, cycle.startDate(), asOfDate
        );

        Map<LocalDate, Map<TransactionType, BigDecimal>> dailyMap = new HashMap<>();
        for (Object[] row : rawDaily) {
            LocalDate date = parseDate(row[0]);
            TransactionType type = parseType(row[1]);
            BigDecimal amount = (BigDecimal) row[2];

            dailyMap.computeIfAbsent(date, k -> new EnumMap<>(TransactionType.class))
                    .put(type, amount);
        }

        List<BurnTrajectoryPoint> points = new ArrayList<>();
        BigDecimal cumulativeExpenses = BigDecimal.ZERO;
        BigDecimal cumulativeIncome = BigDecimal.ZERO;

        LocalDate cur = cycle.startDate();
        while (!cur.isAfter(asOfDate)) {
            Map<TransactionType, BigDecimal> typeMap = dailyMap.getOrDefault(cur, Collections.emptyMap());
            BigDecimal dailyExpenses = typeMap.getOrDefault(TransactionType.EXPENSE, BigDecimal.ZERO);
            BigDecimal dailyIncome = typeMap.getOrDefault(TransactionType.INCOME, BigDecimal.ZERO);

            cumulativeExpenses = cumulativeExpenses.add(dailyExpenses);
            cumulativeIncome = cumulativeIncome.add(dailyIncome);
            BigDecimal netCashflow = dailyIncome.subtract(dailyExpenses);

            points.add(new BurnTrajectoryPoint(
                    cur,
                    dailyExpenses,
                    cumulativeExpenses,
                    dailyIncome,
                    cumulativeIncome,
                    netCashflow
            ));

            cur = cur.plusDays(1);
        }

        return new BurnTrajectoryResponse(cycle.startDate(), cycle.endDate(), asOfDate, points);
    }

    @Transactional(readOnly = true)
    public List<CategoryBreakdownItem> getCategoryBreakdown() {
        Long userId = currentUserProvider.getCurrentUserId();
        User user = getUser(userId);

        LocalDate today = LocalDate.now(clock);
        PayCycle cycle = cycleCalculator.calculateCycle(today, user.getCycleStartDay());

        List<Object[]> rawCategories = transactionRepository.findCategoryTotalsByUserIdAndTypeAndDateBetween(
                userId, TransactionType.EXPENSE, cycle.startDate(), cycle.endDate()
        );

        BigDecimal totalExpenses = BigDecimal.ZERO;
        for (Object[] row : rawCategories) {
            totalExpenses = totalExpenses.add((BigDecimal) row[2]);
        }

        if (totalExpenses.compareTo(BigDecimal.ZERO) == 0) {
            return Collections.emptyList();
        }

        List<CategoryBreakdownItem> items = new ArrayList<>();
        for (Object[] row : rawCategories) {
            Long categoryId = ((Number) row[0]).longValue();
            String categoryName = (String) row[1];
            BigDecimal amount = (BigDecimal) row[2];

            BigDecimal percentage = amount.multiply(BigDecimal.valueOf(100))
                    .divide(totalExpenses, 2, RoundingMode.HALF_UP)
                    .setScale(2, RoundingMode.HALF_UP);

            items.add(new CategoryBreakdownItem(categoryId, categoryName, amount, percentage));
        }

        return items;
    }

    @Transactional(readOnly = true)
    public CashflowSummaryResponse getCashflowSummary() {
        Long userId = currentUserProvider.getCurrentUserId();
        User user = getUser(userId);

        LocalDate today = LocalDate.now(clock);
        PayCycle cycle = cycleCalculator.calculateCycle(today, user.getCycleStartDay());

        List<Object[]> rawTotals = transactionRepository.findCashflowTotalsByUserIdAndDateBetween(
                userId, cycle.startDate(), cycle.endDate()
        );

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        long transactionCount = 0L;

        for (Object[] row : rawTotals) {
            TransactionType type = parseType(row[0]);
            BigDecimal amount = (BigDecimal) row[1];
            long count = ((Number) row[2]).longValue();

            transactionCount += count;
            if (type == TransactionType.INCOME) {
                totalIncome = totalIncome.add(amount);
            } else if (type == TransactionType.EXPENSE) {
                totalExpenses = totalExpenses.add(amount);
            }
        }

        BigDecimal netCashflow = totalIncome.subtract(totalExpenses);

        return new CashflowSummaryResponse(
                totalIncome,
                totalExpenses,
                netCashflow,
                transactionCount,
                cycle.startDate(),
                cycle.endDate()
        );
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }

    private LocalDate parseDate(Object dateObj) {
        if (dateObj instanceof LocalDate ld) {
            return ld;
        } else if (dateObj instanceof java.sql.Date sqld) {
            return sqld.toLocalDate();
        } else {
            return LocalDate.parse(dateObj.toString());
        }
    }

    private TransactionType parseType(Object typeObj) {
        if (typeObj instanceof TransactionType tt) {
            return tt;
        } else {
            return TransactionType.valueOf(typeObj.toString());
        }
    }
}
