package com.solvence.service;

import com.solvence.dto.CreateObligationRequest;
import com.solvence.dto.UpdateObligationRequest;
import com.solvence.entity.*;
import com.solvence.exception.ForbiddenException;
import com.solvence.exception.ResourceNotFoundException;
import com.solvence.repository.CategoryRepository;
import com.solvence.repository.ObligationOccurrenceRepository;
import com.solvence.repository.RecurringObligationRepository;
import com.solvence.repository.TransactionRepository;
import com.solvence.repository.UserRepository;
import com.solvence.security.CurrentUserProvider;
import com.solvence.service.runway.OccurrenceGenerationService;
import com.solvence.service.runway.PayCycleEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ObligationSecurityIntegrationTest {

    @Mock
    private RecurringObligationRepository obligationRepository;

    @Mock
    private ObligationOccurrenceRepository occurrenceRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private ObligationService obligationService;

    private final LocalDate today = LocalDate.of(2026, 3, 13);
    private final Clock fixedClock = Clock.fixed(today.atStartOfDay(ZoneId.of("UTC")).toInstant(), ZoneId.of("UTC"));

    private User user1;
    private User user2;
    private Category user2Category;
    private RecurringObligation user2Obligation;

    @BeforeEach
    void setUp() {
        PayCycleEngine payCycleEngine = new PayCycleEngine(fixedClock);
        OccurrenceGenerationService generationService = new OccurrenceGenerationService(
                occurrenceRepository, obligationRepository, fixedClock);

        obligationService = new ObligationService(
                obligationRepository,
                occurrenceRepository,
                categoryRepository,
                userRepository,
                transactionRepository,
                currentUserProvider,
                payCycleEngine,
                generationService,
                fixedClock
        );

        user1 = new User(1L, "User 1", "user1@solvence.local", null, "INR",
                new BigDecimal("25000.00"), new BigDecimal("300.00"), 1);

        user2 = new User(2L, "User 2", "user2@solvence.local", null, "INR",
                new BigDecimal("50000.00"), new BigDecimal("500.00"), 1);

        user2Category = new Category(20L, user2, "User 2 Category", TransactionType.EXPENSE, false, "user2-cat");

        user2Obligation = new RecurringObligation(200L, user2, user2Category, "User 2 Rent",
                new BigDecimal("20000.00"), 5, ObligationFrequency.MONTHLY, true);

        // Current authenticated user is user 1
        lenient().when(currentUserProvider.getCurrentUserId()).thenReturn(1L);
        lenient().when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
    }

    @Test
    @DisplayName("Cross-Tenant: User 1 cannot create obligation with category owned by User 2")
    void testCannotCreateObligationWithOtherUserCategory() {
        when(categoryRepository.findById(20L)).thenReturn(Optional.of(user2Category));

        CreateObligationRequest request = new CreateObligationRequest(
                "My Obligation",
                new BigDecimal("5000.00"),
                10,
                20L,
                "notes"
        );

        assertThrows(ForbiddenException.class, () -> obligationService.createObligation(request));
    }

    @Test
    @DisplayName("Cross-Tenant: User 1 cannot update obligation owned by User 2")
    void testCannotUpdateOtherUserObligation() {
        when(obligationRepository.findById(200L)).thenReturn(Optional.of(user2Obligation));

        UpdateObligationRequest request = new UpdateObligationRequest(
                "Hacked Name",
                new BigDecimal("100.00"),
                null,
                null,
                null,
                null
        );

        assertThrows(ForbiddenException.class, () -> obligationService.updateObligation(200L, request));
    }

    @Test
    @DisplayName("Cross-Tenant: User 1 cannot delete obligation owned by User 2")
    void testCannotDeleteOtherUserObligation() {
        when(obligationRepository.findById(200L)).thenReturn(Optional.of(user2Obligation));

        assertThrows(ForbiddenException.class, () -> obligationService.deleteObligation(200L));
    }

    @Test
    @DisplayName("Cross-Tenant: User 1 cannot fulfill obligation owned by User 2")
    void testCannotFulfillOtherUserObligation() {
        when(obligationRepository.findById(200L)).thenReturn(Optional.of(user2Obligation));

        assertThrows(ForbiddenException.class, () -> obligationService.fulfillObligation(200L, null));
    }

    @Test
    @DisplayName("Cross-Tenant: User 1 cannot skip obligation owned by User 2")
    void testCannotSkipOtherUserObligation() {
        when(obligationRepository.findById(200L)).thenReturn(Optional.of(user2Obligation));

        assertThrows(ForbiddenException.class, () -> obligationService.skipObligation(200L));
    }

    @Test
    @DisplayName("Not Found: Operating on non-existent obligation returns ResourceNotFoundException")
    void testNonExistentObligationThrowsNotFound() {
        when(obligationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> obligationService.deleteObligation(999L));
    }
}
