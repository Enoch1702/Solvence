package com.solvence.service.decision;

import com.solvence.dto.RunwaySummaryResponse;
import com.solvence.dto.SpendDecisionResponse;
import com.solvence.exception.BusinessValidationException;
import com.solvence.model.decision.DecisionStatus;
import com.solvence.service.runway.LifeHourCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class DecisionCalculationServiceTest {

    private DecisionCalculationService service;
    private RunwaySummaryResponse runway;

    @BeforeEach
    void setUp() {
        LifeHourCalculator lifeHourCalculator = new LifeHourCalculator();
        service = new DecisionCalculationService(lifeHourCalculator);

        // Standard test runway baseline:
        // Total Balance = 53,000, Protected Bills = 15,000, Spending Money = 38,000, Safe Daily = 2,000, Days Remaining = 19
        runway = new RunwaySummaryResponse(
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
    }

    @Test
    @DisplayName("Amount below Safe to Spend Today returns SAFE")
    void testAmountBelowSafeToSpendReturnsSafe() {
        SpendDecisionResponse response = service.evaluateSpend(runway, new BigDecimal("750.00"), new BigDecimal("300.00"), "INR");

        assertEquals(DecisionStatus.SAFE, response.decision());
        assertEquals(new BigDecimal("750.00"), response.amount());
        assertEquals(new BigDecimal("37250.00"), response.hypotheticalSpendingMoney());
        // 37,250 / 19 = 1,960.526... -> 1,960.53
        assertEquals(new BigDecimal("1960.53"), response.hypotheticalSafeToSpendToday());
        assertEquals(new BigDecimal("2.5"), response.laborCostHours());
        assertFalse(response.isDeficit());
        assertEquals(new BigDecimal("0.00"), response.deficitAmount());
        assertEquals("This fits within today's safe spending amount.", response.message());
    }

    @Test
    @DisplayName("Amount equal to Safe to Spend Today returns SAFE")
    void testAmountEqualToSafeToSpendReturnsSafe() {
        SpendDecisionResponse response = service.evaluateSpend(runway, new BigDecimal("2000.00"), new BigDecimal("300.00"), "INR");

        assertEquals(DecisionStatus.SAFE, response.decision());
        assertEquals(new BigDecimal("36000.00"), response.hypotheticalSpendingMoney());
        // 36,000 / 19 = 1,894.736... -> 1,894.74
        assertEquals(new BigDecimal("1894.74"), response.hypotheticalSafeToSpendToday());
        assertEquals("This fits within today's safe spending amount.", response.message());
    }

    @Test
    @DisplayName("Amount above Safe to Spend Today but within Spending Money returns CAUTION")
    void testAmountAboveSafeSpendWithinSpendingMoneyReturnsCaution() {
        SpendDecisionResponse response = service.evaluateSpend(runway, new BigDecimal("3000.00"), new BigDecimal("300.00"), "INR");

        assertEquals(DecisionStatus.CAUTION, response.decision());
        assertEquals(new BigDecimal("35000.00"), response.hypotheticalSpendingMoney());
        // 35,000 / 19 = 1,842.105... -> 1,842.11
        assertEquals(new BigDecimal("1842.11"), response.hypotheticalSafeToSpendToday());
        // Labor cost: 3000 / 300 = 10.0
        assertEquals(new BigDecimal("10.0"), response.laborCostHours());
        assertFalse(response.isDeficit());
        assertEquals("You can cover this from current spending money, but it is above today's safe amount.", response.message());
    }

    @Test
    @DisplayName("Amount exceeding Spending Money returns NOT_SAFE and sets deficit")
    void testAmountExceedingSpendingMoneyReturnsNotSafe() {
        SpendDecisionResponse response = service.evaluateSpend(runway, new BigDecimal("40000.00"), new BigDecimal("300.00"), "INR");

        assertEquals(DecisionStatus.NOT_SAFE, response.decision());
        assertEquals(new BigDecimal("-2000.00"), response.hypotheticalSpendingMoney());
        assertEquals(new BigDecimal("0.00"), response.hypotheticalSafeToSpendToday());
        assertTrue(response.isDeficit());
        assertEquals(new BigDecimal("2000.00"), response.deficitAmount());
        assertEquals("This would put your spending money below zero after protected bills.", response.message());
    }

    @Test
    @DisplayName("Null, zero, or negative amounts throw BusinessValidationException")
    void testInvalidAmountsThrowException() {
        assertThrows(BusinessValidationException.class, () ->
                service.evaluateSpend(runway, null, new BigDecimal("300.00"), "INR"));

        assertThrows(BusinessValidationException.class, () ->
                service.evaluateSpend(runway, BigDecimal.ZERO, new BigDecimal("300.00"), "INR"));

        assertThrows(BusinessValidationException.class, () ->
                service.evaluateSpend(runway, new BigDecimal("-100.00"), new BigDecimal("300.00"), "INR"));
    }

    @Test
    @DisplayName("Labor cost returns null when hourly rate is null or zero")
    void testLaborCostNullWhenHourlyRateUnavailable() {
        SpendDecisionResponse nullRateResp = service.evaluateSpend(runway, new BigDecimal("750.00"), null, "INR");
        assertNull(nullRateResp.laborCostHours());

        SpendDecisionResponse zeroRateResp = service.evaluateSpend(runway, new BigDecimal("750.00"), BigDecimal.ZERO, "INR");
        assertNull(zeroRateResp.laborCostHours());
    }

    @Test
    @DisplayName("Zero days remaining clamps safe to spend and hypothetical safe daily spend to 0.00")
    void testZeroDaysRemaining() {
        RunwaySummaryResponse zeroDaysRunway = new RunwaySummaryResponse(
                new BigDecimal("53000.00"),
                new BigDecimal("15000.00"),
                new BigDecimal("38000.00"),
                new BigDecimal("0.00"),
                0,
                new BigDecimal("300.00"),
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 31),
                new BigDecimal("25000.00"),
                new BigDecimal("40000.00"),
                new BigDecimal("12000.00")
        );

        SpendDecisionResponse response = service.evaluateSpend(zeroDaysRunway, new BigDecimal("1000.00"), new BigDecimal("300.00"), "INR");
        assertEquals(new BigDecimal("0.00"), response.safeToSpendToday());
        assertEquals(new BigDecimal("0.00"), response.hypotheticalSafeToSpendToday());
        assertEquals(DecisionStatus.CAUTION, response.decision());
    }

    @Test
    @DisplayName("Boundary: Proposed amount exactly equal to Spending Money returns CAUTION with zero resulting cash")
    void testAmountExactlyEqualToSpendingMoneyReturnsCaution() {
        // Spending Money = 38,000.00; Safe Daily = 2,000.00
        SpendDecisionResponse response = service.evaluateSpend(runway, new BigDecimal("38000.00"), new BigDecimal("300.00"), "INR");

        assertEquals(DecisionStatus.CAUTION, response.decision());
        assertEquals(new BigDecimal("0.00"), response.hypotheticalSpendingMoney());
        assertEquals(new BigDecimal("0.00"), response.hypotheticalSafeToSpendToday());
        assertFalse(response.isDeficit());
        assertEquals(new BigDecimal("0.00"), response.deficitAmount());
    }

    @Test
    @DisplayName("Boundary: Proposed amount one cent above Spending Money returns NOT_SAFE")
    void testAmountOneCentGreaterThanSpendingMoneyReturnsNotSafe() {
        // Spending Money = 38,000.00; spend 38,000.01 -> deficit 0.01
        SpendDecisionResponse response = service.evaluateSpend(runway, new BigDecimal("38000.01"), new BigDecimal("300.00"), "INR");

        assertEquals(DecisionStatus.NOT_SAFE, response.decision());
        assertEquals(new BigDecimal("-0.01"), response.hypotheticalSpendingMoney());
        assertTrue(response.isDeficit());
        assertEquals(new BigDecimal("0.01"), response.deficitAmount());
    }

    @Test
    @DisplayName("Boundary: Spending Money already zero returns NOT_SAFE for any positive spend")
    void testZeroSpendingMoneyReturnsNotSafe() {
        RunwaySummaryResponse zeroCashRunway = new RunwaySummaryResponse(
                new BigDecimal("15000.00"),
                new BigDecimal("15000.00"),
                new BigDecimal("0.00"),
                new BigDecimal("0.00"),
                10,
                new BigDecimal("300.00"),
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 31),
                new BigDecimal("15000.00"),
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        SpendDecisionResponse response = service.evaluateSpend(zeroCashRunway, new BigDecimal("50.00"), new BigDecimal("300.00"), "INR");
        assertEquals(DecisionStatus.NOT_SAFE, response.decision());
        assertEquals(new BigDecimal("-50.00"), response.hypotheticalSpendingMoney());
        assertTrue(response.isDeficit());
        assertEquals(new BigDecimal("50.00"), response.deficitAmount());
    }

    @Test
    @DisplayName("Boundary: Spending Money already negative returns NOT_SAFE with increased deficit")
    void testNegativeSpendingMoneyIncreasesDeficit() {
        RunwaySummaryResponse negCashRunway = new RunwaySummaryResponse(
                new BigDecimal("10000.00"),
                new BigDecimal("15000.00"),
                new BigDecimal("-5000.00"),
                new BigDecimal("0.00"),
                10,
                new BigDecimal("300.00"),
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 31),
                new BigDecimal("10000.00"),
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        SpendDecisionResponse response = service.evaluateSpend(negCashRunway, new BigDecimal("1000.00"), new BigDecimal("300.00"), "INR");
        assertEquals(DecisionStatus.NOT_SAFE, response.decision());
        assertEquals(new BigDecimal("-6000.00"), response.hypotheticalSpendingMoney());
        assertTrue(response.isDeficit());
        assertEquals(new BigDecimal("6000.00"), response.deficitAmount());
    }

    @Test
    @DisplayName("Boundary: Safe to Spend Today is 0.00 but Spending Money is positive returns CAUTION")
    void testSafeToSpendZeroWithPositiveSpendingMoneyReturnsCaution() {
        RunwaySummaryResponse zeroSafeRunway = new RunwaySummaryResponse(
                new BigDecimal("20000.00"),
                new BigDecimal("15000.00"),
                new BigDecimal("5000.00"),
                new BigDecimal("0.00"),
                0,
                new BigDecimal("300.00"),
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 31),
                new BigDecimal("20000.00"),
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        SpendDecisionResponse response = service.evaluateSpend(zeroSafeRunway, new BigDecimal("500.00"), new BigDecimal("300.00"), "INR");
        assertEquals(DecisionStatus.CAUTION, response.decision());
        assertEquals(new BigDecimal("4500.00"), response.hypotheticalSpendingMoney());
    }

    @Test
    @DisplayName("Labor cost returns null when hourly rate is negative")
    void testLaborCostNullWhenHourlyRateNegative() {
        SpendDecisionResponse negRateResp = service.evaluateSpend(runway, new BigDecimal("750.00"), new BigDecimal("-100.00"), "INR");
        assertNull(negRateResp.laborCostHours());
    }

    @Test
    @DisplayName("Projected Cycle-End Balance reflects Total Balance minus Protected Bills")
    void testProjectedCycleEndBalance() {
        SpendDecisionResponse response = service.evaluateSpend(runway, new BigDecimal("750.00"), new BigDecimal("300.00"), "INR");
        // Total Balance (53,000) - Protected Bills (15,000) = 38,000.00
        assertEquals(new BigDecimal("38000.00"), response.projectedCycleEndBalance());
    }
}
