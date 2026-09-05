package com.solvence.service.runway;

import java.time.LocalDate;

public record PayCycle(
        LocalDate startDate,
        LocalDate endDate,
        long daysRemaining
) {
}
