package com.solvence.service.runway;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Calculates Life-Hours: the amount of life energy (hours worked) an expense represents.
 * Formula: amount / verified hourly wage
 */
@Component
public class LifeHourCalculator {

    public BigDecimal calculateLifeHours(BigDecimal amount, BigDecimal hourlyRate) {
        if (amount == null || hourlyRate == null || hourlyRate.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        return amount.divide(hourlyRate, 1, RoundingMode.HALF_UP);
    }
}
