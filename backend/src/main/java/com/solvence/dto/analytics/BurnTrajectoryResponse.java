package com.solvence.dto.analytics;

import java.time.LocalDate;
import java.util.List;

public record BurnTrajectoryResponse(
        LocalDate cycleStart,
        LocalDate cycleEnd,
        LocalDate asOfDate,
        List<BurnTrajectoryPoint> points
) {
}
