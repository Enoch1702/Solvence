package com.solvence.service.runway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class LifeHourCalculatorTest {

    private LifeHourCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new LifeHourCalculator();
    }

    @Test
    void testVerificationScenario750at300ProducesTwoPointFiveHours() {
        BigDecimal amount = new BigDecimal("750.00");
        BigDecimal hourlyRate = new BigDecimal("300.00");

        BigDecimal lifeHours = calculator.calculateLifeHours(amount, hourlyRate);

        assertNotNull(lifeHours);
        assertEquals(new BigDecimal("2.5"), lifeHours);
    }

    @Test
    void testZeroHourlyRateReturnsNull() {
        BigDecimal amount = new BigDecimal("750.00");
        BigDecimal hourlyRate = BigDecimal.ZERO;

        BigDecimal lifeHours = calculator.calculateLifeHours(amount, hourlyRate);

        assertNull(lifeHours);
    }

    @Test
    void testNullHourlyRateReturnsNull() {
        BigDecimal amount = new BigDecimal("750.00");

        BigDecimal lifeHours = calculator.calculateLifeHours(amount, null);

        assertNull(lifeHours);
    }

    @Test
    void testNullAmountReturnsNull() {
        BigDecimal hourlyRate = new BigDecimal("300.00");

        BigDecimal lifeHours = calculator.calculateLifeHours(null, hourlyRate);

        assertNull(lifeHours);
    }

    @Test
    void testRoundingModeHalfUp() {
        // 100 / 300 = 0.3333... -> 0.3
        BigDecimal lifeHours1 = calculator.calculateLifeHours(new BigDecimal("100.00"), new BigDecimal("300.00"));
        assertEquals(new BigDecimal("0.3"), lifeHours1);

        // 200 / 300 = 0.6666... -> 0.7
        BigDecimal lifeHours2 = calculator.calculateLifeHours(new BigDecimal("200.00"), new BigDecimal("300.00"));
        assertEquals(new BigDecimal("0.7"), lifeHours2);
    }
}
