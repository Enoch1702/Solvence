package com.solvence.controller;

import com.solvence.dto.analytics.BurnTrajectoryResponse;
import com.solvence.dto.analytics.CashflowSummaryResponse;
import com.solvence.dto.analytics.CategoryBreakdownItem;
import com.solvence.service.analytics.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/burn-trajectory")
    public ResponseEntity<BurnTrajectoryResponse> getBurnTrajectory() {
        return ResponseEntity.ok(analyticsService.getBurnTrajectory());
    }

    @GetMapping("/category-breakdown")
    public ResponseEntity<List<CategoryBreakdownItem>> getCategoryBreakdown() {
        return ResponseEntity.ok(analyticsService.getCategoryBreakdown());
    }

    @GetMapping("/cashflow-summary")
    public ResponseEntity<CashflowSummaryResponse> getCashflowSummary() {
        return ResponseEntity.ok(analyticsService.getCashflowSummary());
    }
}
