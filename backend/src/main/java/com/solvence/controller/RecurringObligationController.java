package com.solvence.controller;

import com.solvence.dto.CreateObligationRequest;
import com.solvence.dto.FulfillObligationRequest;
import com.solvence.dto.ObligationOccurrenceResponse;
import com.solvence.dto.ObligationResponse;
import com.solvence.dto.UpdateObligationRequest;
import com.solvence.service.ObligationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/obligations")
public class RecurringObligationController {

    private final ObligationService obligationService;

    public RecurringObligationController(ObligationService obligationService) {
        this.obligationService = obligationService;
    }

    @PostMapping
    public ResponseEntity<ObligationResponse> createObligation(@Valid @RequestBody CreateObligationRequest request) {
        ObligationResponse response = obligationService.createObligation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ObligationResponse>> getObligations() {
        List<ObligationResponse> responses = obligationService.getObligations();
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ObligationResponse> updateObligation(@PathVariable Long id,
                                                               @Valid @RequestBody UpdateObligationRequest request) {
        ObligationResponse response = obligationService.updateObligation(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteObligation(@PathVariable Long id) {
        obligationService.deleteObligation(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/fulfill")
    public ResponseEntity<ObligationOccurrenceResponse> fulfillObligation(
            @PathVariable Long id,
            @RequestBody(required = false) FulfillObligationRequest request) {
        ObligationOccurrenceResponse response = obligationService.fulfillObligation(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/skip")
    public ResponseEntity<ObligationOccurrenceResponse> skipObligation(@PathVariable Long id) {
        ObligationOccurrenceResponse response = obligationService.skipObligation(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/occurrences/current")
    public ResponseEntity<List<ObligationOccurrenceResponse>> getCurrentCycleOccurrences() {
        List<ObligationOccurrenceResponse> responses = obligationService.getCurrentCycleOccurrences();
        return ResponseEntity.ok(responses);
    }
}
