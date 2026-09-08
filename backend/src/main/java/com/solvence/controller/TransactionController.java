package com.solvence.controller;

import com.solvence.dto.CreateTransactionRequest;
import com.solvence.dto.QuickCaptureRequest;
import com.solvence.dto.TransactionResponse;
import com.solvence.service.QuickCaptureParserService;
import com.solvence.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final QuickCaptureParserService quickCaptureParserService;

    public TransactionController(TransactionService transactionService,
                                 QuickCaptureParserService quickCaptureParserService) {
        this.transactionService = transactionService;
        this.quickCaptureParserService = quickCaptureParserService;
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(@Valid @RequestBody CreateTransactionRequest request) {
        TransactionResponse response = transactionService.createTransaction(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/quick-capture")
    public ResponseEntity<TransactionResponse> quickCapture(@Valid @RequestBody QuickCaptureRequest request) {
        TransactionResponse response = quickCaptureParserService.parseAndCreate(request.input());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getTransactions() {
        List<TransactionResponse> transactions = transactionService.getTransactions();
        return ResponseEntity.ok(transactions);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }
}
