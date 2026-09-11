package com.solvence.service.runway;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;

/**
 * Calculates pay cycle boundaries and remaining days.
 * Delegates monthly calculations to PayCycleEngine while preserving legacy API compatibility.
 */
@Component
public class CycleCalculator {

    private final PayCycleEngine payCycleEngine;
    private final Clock clock;

    @Autowired
    public CycleCalculator(PayCycleEngine payCycleEngine, Clock clock) {
        this.payCycleEngine = payCycleEngine;
        this.clock = clock;
    }

    public CycleCalculator(Clock clock) {
        this(new PayCycleEngine(clock), clock);
    }

    public PayCycle calculateCycle(int cycleStartDay) {
        return calculateCycle(LocalDate.now(clock), cycleStartDay);
    }

    public PayCycle calculateCycle(LocalDate today, int cycleStartDay) {
        if (cycleStartDay < 1 || cycleStartDay > 31) {
            throw new IllegalArgumentException("cycle_start_day must be between 1 and 31");
        }
        return payCycleEngine.calculateMonthly(cycleStartDay, today);
    }
}
