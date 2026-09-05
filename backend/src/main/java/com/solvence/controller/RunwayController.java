package com.solvence.controller;

import com.solvence.dto.RunwaySummaryResponse;
import com.solvence.service.runway.RunwayCalculationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/runway")
public class RunwayController {

    private final RunwayCalculationService runwayCalculationService;

    public RunwayController(RunwayCalculationService runwayCalculationService) {
        this.runwayCalculationService = runwayCalculationService;
    }

    @GetMapping("/summary")
    public ResponseEntity<RunwaySummaryResponse> getRunwaySummary() {
        RunwaySummaryResponse response = runwayCalculationService.getRunwaySummary();
        return ResponseEntity.ok(response);
    }
}
