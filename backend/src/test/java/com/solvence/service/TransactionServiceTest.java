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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private TransactionService transactionService;

    private User currentUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        LifeHourCalculator lifeHourCalculator = new LifeHourCalculator();
        transactionService = new TransactionService(
                transactionRepository,
                categoryRepository,
                userRepository,
                currentUserProvider,
                lifeHourCalculator
        );

        currentUser = new User(1L, "User 1", "user1@solvence.local", null, "INR",
                new BigDecimal("25000.00"), new BigDecimal("300.00"), 1);
        otherUser = new User(2L, "User 2", "user2@solvence.local", null, "INR",
                new BigDecimal("10000.00"), new BigDecimal("200.00"), 1);

        lenient().when(currentUserProvider.getCurrentUserId()).thenReturn(1L);
    }

    @Test
    void testCreateTransactionWithSystemCategorySucceeds() {
        Category systemCategory = new Category(10L, null, "Food", TransactionType.EXPENSE, true, "food");

        when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(categoryRepository.findById(10L)).thenReturn(Optional.of(systemCategory));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> {
            Transaction t = inv.getArgument(0);
            t.setId(100L);
            return t;
        });

        CreateTransactionRequest request = new CreateTransactionRequest(
                new BigDecimal("750.00"),
                TransactionType.EXPENSE,
                10L,
                "Team Lunch",
                LocalDate.of(2026, 3, 10)
        );

        TransactionResponse response = transactionService.createTransaction(request);

        assertNotNull(response);
        assertEquals(100L, response.id());
        assertEquals(new BigDecimal("750.00"), response.amount());
        // Life hours: 750 / 300 = 2.5
        assertEquals(new BigDecimal("2.5"), response.lifeHours());
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void testCreateTransactionWithOtherUserCategoryThrowsForbidden() {
        Category otherUserCategory = new Category(20L, otherUser, "Custom", TransactionType.EXPENSE, false, "custom");

        when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(categoryRepository.findById(20L)).thenReturn(Optional.of(otherUserCategory));

        CreateTransactionRequest request = new CreateTransactionRequest(
                new BigDecimal("500.00"),
                TransactionType.EXPENSE,
                20L,
                "Disallowed expense",
                LocalDate.of(2026, 3, 10)
        );

        assertThrows(ForbiddenException.class, () -> transactionService.createTransaction(request));
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void testCreateTransactionWithNonExistentCategoryThrowsNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        CreateTransactionRequest request = new CreateTransactionRequest(
                new BigDecimal("500.00"),
                TransactionType.EXPENSE,
                999L,
                "Non-existent",
                LocalDate.of(2026, 3, 10)
        );

        assertThrows(ResourceNotFoundException.class, () -> transactionService.createTransaction(request));
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void testDeleteTransactionOwnedByCurrentUserSucceeds() {
        Category category = new Category(10L, null, "Food", TransactionType.EXPENSE, true, "food");
        Transaction transaction = new Transaction(
                50L, currentUser, category, new BigDecimal("100.00"),
                TransactionType.EXPENSE, "Snacks", LocalDate.now()
        );

        when(transactionRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(transaction));

        transactionService.deleteTransaction(50L);

        verify(transactionRepository).delete(transaction);
    }

    @Test
    void testDeleteTransactionOwnedByOtherUserThrowsNotFound() {
        when(transactionRepository.findByIdAndUserId(60L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> transactionService.deleteTransaction(60L));
        verify(transactionRepository, never()).delete(any());
    }

    @Test
    void testGetTransactionsScopedToCurrentUser() {
        Category category = new Category(10L, null, "Food", TransactionType.EXPENSE, true, "food");
        Transaction t1 = new Transaction(1L, currentUser, category, new BigDecimal("100.00"),
                TransactionType.EXPENSE, "Snack 1", LocalDate.now());
        Transaction t2 = new Transaction(2L, currentUser, category, new BigDecimal("200.00"),
                TransactionType.EXPENSE, "Snack 2", LocalDate.now());

        when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(transactionRepository.findByUserIdOrderByTransactionDateDescCreatedAtDesc(1L))
                .thenReturn(List.of(t2, t1));

        List<TransactionResponse> result = transactionService.getTransactions();

        assertEquals(2, result.size());
        assertEquals(2L, result.get(0).id());
        assertEquals(1L, result.get(1).id());
    }
}
