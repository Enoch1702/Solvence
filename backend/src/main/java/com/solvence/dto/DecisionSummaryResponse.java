package com.solvence.dto;

public record DecisionSummaryResponse(
        RunwaySummaryResponse runway,
        SpendingPaceResponse spendingPace,
        CycleEndProjectionResponse cycleEndProjection
) {
}
