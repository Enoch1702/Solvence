package com.solvence.service.runway;

import com.solvence.entity.Category;
import com.solvence.entity.ObligationFrequency;
import com.solvence.entity.RecurringObligation;
import com.solvence.entity.TransactionType;
import com.solvence.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RecurringObligationCalculatorTest {

    private RecurringObligationCalculator calculator;
    private User testUser;
    private Category rentCategory;

    @BeforeEach
    void setUp() {
        calculator = new RecurringObligationCalculator();
        testUser = new User(1L, "Test User", "test@solvence.local", null, "INR", BigDecimal.ZERO, null, 1);
        rentCategory = new Category(1L, null, "Rent", TransactionType.EXPENSE, true, "rent");
    }

    @Test
    void testActiveObligationsUpcomingInCycleAreSummed() {
        RecurringObligation rent = new RecurringObligation(
                1L, testUser, rentCategory, "Rent",
                new BigDecimal("15000.00"), 5, ObligationFrequency.MONTHLY, true
        );
        RecurringObligation wifi = new RecurringObligation(
                2L, testUser, rentCategory, "WiFi",
                new BigDecimal("1200.00"), 20, ObligationFrequency.MONTHLY, true
        );

        // Cycle: March 1 to March 31. Today is March 1.
        // Both day 5 and day 20 are upcoming in the cycle.
        BigDecimal total = calculator.calculateCommittedBills(
                List.of(rent, wifi),
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 31)
        );

        assertEquals(new BigDecimal("16200.00"), total);
    }

    @Test
    void testPastObligationsAreExcluded() {
        RecurringObligation rent = new RecurringObligation(
                1L, testUser, rentCategory, "Rent",
                new BigDecimal("15000.00"), 5, ObligationFrequency.MONTHLY, true
        );
        RecurringObligation wifi = new RecurringObligation(
                2L, testUser, rentCategory, "WiFi",
                new BigDecimal("1200.00"), 20, ObligationFrequency.MONTHLY, true
        );

        // Cycle: March 1 to March 31. Today is March 10.
        // Rent (due day 5) has already passed. Only WiFi (day 20) remains.
        BigDecimal total = calculator.calculateCommittedBills(
                List.of(rent, wifi),
                LocalDate.of(2026, 3, 10),
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 31)
        );

        assertEquals(new BigDecimal("1200.00"), total);
    }

    @Test
    void testInactiveObligationsAreIgnored() {
        RecurringObligation gym = new RecurringObligation(
                3L, testUser, rentCategory, "Old Gym",
                new BigDecimal("2000.00"), 15, ObligationFrequency.MONTHLY, false // inactive
        );

        BigDecimal total = calculator.calculateCommittedBills(
                List.of(gym),
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 31)
        );

        assertEquals(BigDecimal.ZERO, total);
    }

    @Test
    void testClampedDueDayThirtyOneInFebruary() {
        // Obligation has due day 31
        RecurringObligation sub = new RecurringObligation(
                4L, testUser, rentCategory, "Streaming Service",
                new BigDecimal("500.00"), 31, ObligationFrequency.MONTHLY, true
        );

        // February 2026 has 28 days. Clamped due date is Feb 28.
        // Today is Feb 15. Feb 28 is upcoming!
        BigDecimal total = calculator.calculateCommittedBills(
                List.of(sub),
                LocalDate.of(2026, 2, 15),
                LocalDate.of(2026, 2, 1),
                LocalDate.of(2026, 2, 28)
        );

        assertEquals(new BigDecimal("500.00"), total);
    }
}
