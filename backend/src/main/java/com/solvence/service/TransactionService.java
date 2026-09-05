package com.solvence.service;

import com.solvence.dto.CreateTransactionRequest;
import com.solvence.dto.TransactionResponse;
import com.solvence.entity.Category;
import com.solvence.entity.Transaction;
import com.solvence.entity.TransactionType;
import com.solvence.entity.User;
import com.solvence.exception.ForbiddenException;
import com.solvence.exception.ResourceNotFoundException;
import com.solvence.repository.CategoryRepository;
import com.solvence.repository.TransactionRepository;
import com.solvence.repository.UserRepository;
import com.solvence.security.CurrentUserProvider;
import com.solvence.service.runway.LifeHourCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;
    private final LifeHourCalculator lifeHourCalculator;

    public TransactionService(TransactionRepository transactionRepository,
                              CategoryRepository categoryRepository,
                              UserRepository userRepository,
                              CurrentUserProvider currentUserProvider,
                              LifeHourCalculator lifeHourCalculator) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.currentUserProvider = currentUserProvider;
        this.lifeHourCalculator = lifeHourCalculator;
    }

    @Transactional
    public TransactionResponse createTransaction(CreateTransactionRequest request) {
        Long currentUserId = currentUserProvider.getCurrentUserId();

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found with ID: " + currentUserId));

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.categoryId()));

        // Security Boundary: Validate Category Ownership
        // A user may only use system categories (user == null) or categories they own
        if (!category.isSystemCategory() && !category.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Cannot use category belonging to another user");
        }

        Transaction transaction = new Transaction(
                null,
                user,
                category,
                request.amount(),
                request.type(),
                request.description(),
                request.transactionDate()
        );

        Transaction saved = transactionRepository.save(transaction);
        BigDecimal lifeHours = computeLifeHours(saved, user.getHourlyRate());
        return TransactionResponse.fromEntity(saved, lifeHours);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactions() {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        User user = userRepository.findById(currentUserId).orElse(null);
        BigDecimal hourlyRate = user != null ? user.getHourlyRate() : null;

        return transactionRepository.findByUserIdOrderByTransactionDateDescCreatedAtDesc(currentUserId)
                .stream()
                .map(t -> TransactionResponse.fromEntity(t, computeLifeHours(t, hourlyRate)))
                .toList();
    }

    @Transactional
    public void deleteTransaction(Long id) {
        Long currentUserId = currentUserProvider.getCurrentUserId();

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + id));

        // Security Boundary: Validate Transaction Ownership
        if (!transaction.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Cannot delete transaction belonging to another user");
        }

        transactionRepository.delete(transaction);
    }

    private BigDecimal computeLifeHours(Transaction transaction, BigDecimal hourlyRate) {
        if (transaction.getType() == TransactionType.EXPENSE) {
            return lifeHourCalculator.calculateLifeHours(transaction.getAmount(), hourlyRate);
        }
        return null;
    }
}
