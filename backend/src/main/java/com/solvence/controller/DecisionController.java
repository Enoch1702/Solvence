package com.solvence.controller;

import com.solvence.dto.CycleEndProjectionResponse;
import com.solvence.dto.DecisionSummaryResponse;
import com.solvence.dto.SpendDecisionRequest;
import com.solvence.dto.SpendDecisionResponse;
import com.solvence.dto.SpendingPaceResponse;
import com.solvence.service.decision.DecisionEngineService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/decisions")
public class DecisionController {

    private final DecisionEngineService decisionEngineService;

    public DecisionController(DecisionEngineService decisionEngineService) {
        this.decisionEngineService = decisionEngineService;
    }

    @PostMapping("/spend")
    public ResponseEntity<SpendDecisionResponse> evaluateSpend(@Valid @RequestBody SpendDecisionRequest request) {
        SpendDecisionResponse response = decisionEngineService.evaluateSpend(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/spending-pace")
    public ResponseEntity<SpendingPaceResponse> getSpendingPace() {
        SpendingPaceResponse response = decisionEngineService.getSpendingPace();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cycle-end-projection")
    public ResponseEntity<CycleEndProjectionResponse> getCycleEndProjection() {
        CycleEndProjectionResponse response = decisionEngineService.getCycleEndProjection();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    public ResponseEntity<DecisionSummaryResponse> getDecisionSummary() {
        DecisionSummaryResponse response = decisionEngineService.getDecisionSummary();
        return ResponseEntity.ok(response);
    }
}
