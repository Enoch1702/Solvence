package com.solvence.service.runway;

import com.solvence.dto.FulfillObligationRequest;
import com.solvence.dto.ObligationOccurrenceResponse;
import com.solvence.entity.*;
import com.solvence.repository.CategoryRepository;
import com.solvence.repository.ObligationOccurrenceRepository;
import com.solvence.repository.RecurringObligationRepository;
import com.solvence.repository.TransactionRepository;
import com.solvence.repository.UserRepository;
import com.solvence.security.CurrentUserProvider;
import com.solvence.service.ObligationService;
import com.solvence.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ObligationOccurrenceLifecycleTest {

    @Mock
    private ObligationOccurrenceRepository occurrenceRepository;

    @Mock
    private RecurringObligationRepository obligationRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private OccurrenceGenerationService generationService;
    private ObligationService obligationService;
    private TransactionService transactionService;

    private final LocalDate today = LocalDate.of(2026, 3, 13);
    private final Clock fixedClock = Clock.fixed(today.atStartOfDay(ZoneId.of("UTC")).toInstant(), ZoneId.of("UTC"));

    private User user;
    private Category rentCategory;
    private RecurringObligation rent;

    @BeforeEach
    void setUp() {
        PayCycleEngine payCycleEngine = new PayCycleEngine(fixedClock);
        generationService = new OccurrenceGenerationService(occurrenceRepository, obligationRepository, fixedClock);

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

        transactionService = new TransactionService(
                transactionRepository,
                categoryRepository,
                userRepository,
                currentUserProvider,
                null,
                occurrenceRepository,
                fixedClock
        );

        user = new User(1L, "Test User", "test@solvence.local", null, "INR",
                new BigDecimal("25000.00"), LocalDate.of(2026, 3, 1), new BigDecimal("300.00"),
                PayCycleType.MONTHLY, 1, null, null);

        rentCategory = new Category(10L, null, "Rent", TransactionType.EXPENSE, true, "rent");

        rent = new RecurringObligation(100L, user, rentCategory, "Apartment Rent",
                new BigDecimal("15000.00"), 20, ObligationFrequency.MONTHLY, true);

        lenient().when(currentUserProvider.getCurrentUserId()).thenReturn(1L);
    }

    @Test
    void testIdempotentOccurrenceGeneration() {
        LocalDate cycleStart = LocalDate.of(2026, 3, 1);
        LocalDate cycleEnd = LocalDate.of(2026, 3, 31);

        when(obligationRepository.findByUserIdAndIsActiveTrue(1L)).thenReturn(List.of(rent));

        // First pass: no existing occurrence
        when(occurrenceRepository.findByRecurringObligationIdAndCycleStartDate(100L, cycleStart))
                .thenReturn(Optional.empty());
        when(occurrenceRepository.save(any(ObligationOccurrence.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        List<ObligationOccurrence> pass1 = generationService.generateOccurrencesForCycle(user, cycleStart, cycleEnd, today);
        assertEquals(1, pass1.size());
        assertEquals(OccurrenceStatus.PENDING, pass1.get(0).getStatus());
        assertEquals(LocalDate.of(2026, 3, 20), pass1.get(0).getDueDate());

        // Second pass: existing occurrence returned
        when(occurrenceRepository.findByRecurringObligationIdAndCycleStartDate(100L, cycleStart))
                .thenReturn(Optional.of(pass1.get(0)));

        List<ObligationOccurrence> pass2 = generationService.generateOccurrencesForCycle(user, cycleStart, cycleEnd, today);
        assertEquals(1, pass2.size());
        assertEquals(pass1.get(0).getId(), pass2.get(0).getId());
    }

    @Test
    void testAutoMarkOverdueWhenDueDateInPast() {
        LocalDate cycleStart = LocalDate.of(2026, 3, 1);
        LocalDate cycleEnd = LocalDate.of(2026, 3, 31);

        // Due day 5 is in the past relative to today = 2026-03-13
        RecurringObligation gym = new RecurringObligation(101L, user, rentCategory, "Gym",
                new BigDecimal("2000.00"), 5, ObligationFrequency.MONTHLY, true);

        when(obligationRepository.findByUserIdAndIsActiveTrue(1L)).thenReturn(List.of(gym));
        when(occurrenceRepository.findByRecurringObligationIdAndCycleStartDate(101L, cycleStart))
                .thenReturn(Optional.empty());
        when(occurrenceRepository.save(any(ObligationOccurrence.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        List<ObligationOccurrence> occurrences = generationService.generateOccurrencesForCycle(user, cycleStart, cycleEnd, today);
        assertEquals(1, occurrences.size());
        assertEquals(OccurrenceStatus.OVERDUE, occurrences.get(0).getStatus());
        assertEquals(LocalDate.of(2026, 3, 5), occurrences.get(0).getDueDate());
    }

    @Test
    void testPreservePaidAndSkippedStatusOnRegeneration() {
        LocalDate cycleStart = LocalDate.of(2026, 3, 1);
        LocalDate cycleEnd = LocalDate.of(2026, 3, 31);

        ObligationOccurrence paidOcc = new ObligationOccurrence(1L, rent, user, cycleStart, cycleEnd,
                LocalDate.of(2026, 3, 20), new BigDecimal("15000.00"), OccurrenceStatus.PAID);

        when(obligationRepository.findByUserIdAndIsActiveTrue(1L)).thenReturn(List.of(rent));
        when(occurrenceRepository.findByRecurringObligationIdAndCycleStartDate(100L, cycleStart))
                .thenReturn(Optional.of(paidOcc));

        List<ObligationOccurrence> result = generationService.generateOccurrencesForCycle(user, cycleStart, cycleEnd, today);
        assertEquals(1, result.size());
        assertEquals(OccurrenceStatus.PAID, result.get(0).getStatus());
        verify(occurrenceRepository, never()).save(any());
    }

    @Test
    void testFulfillFlowCreatesTransactionAndMarksPaid() {
        LocalDate cycleStart = LocalDate.of(2026, 3, 1);
        LocalDate cycleEnd = LocalDate.of(2026, 3, 31);

        ObligationOccurrence pendingOcc = new ObligationOccurrence(1L, rent, user, cycleStart, cycleEnd,
                LocalDate.of(2026, 3, 20), new BigDecimal("15000.00"), OccurrenceStatus.PENDING);

        when(obligationRepository.findById(100L)).thenReturn(Optional.of(rent));
        when(occurrenceRepository.findByRecurringObligationIdAndCycleStartDate(100L, cycleStart))
                .thenReturn(Optional.of(pendingOcc));

        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> {
            Transaction t = inv.getArgument(0);
            t.setId(500L);
            return t;
        });

        when(occurrenceRepository.save(any(ObligationOccurrence.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        FulfillObligationRequest request = new FulfillObligationRequest(LocalDate.of(2026, 3, 13), new BigDecimal("15000.00"));
        ObligationOccurrenceResponse response = obligationService.fulfillObligation(100L, request);

        assertNotNull(response);
        assertEquals(OccurrenceStatus.PAID, response.status());
        assertEquals(500L, response.transactionId());
        assertNotNull(response.paidAt());

        // Verify transaction was created with correct fields
        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        Transaction created = captor.getValue();
        assertEquals(new BigDecimal("15000.00"), created.getAmount());
        assertEquals(TransactionType.EXPENSE, created.getType());
        assertEquals(LocalDate.of(2026, 3, 13), created.getTransactionDate());
        assertEquals("Fulfillment: Apartment Rent", created.getDescription());
    }

    @Test
    void testSkipFlowMarksSkippedWithoutTransaction() {
        LocalDate cycleStart = LocalDate.of(2026, 3, 1);
        LocalDate cycleEnd = LocalDate.of(2026, 3, 31);

        ObligationOccurrence pendingOcc = new ObligationOccurrence(1L, rent, user, cycleStart, cycleEnd,
                LocalDate.of(2026, 3, 20), new BigDecimal("15000.00"), OccurrenceStatus.PENDING);

        when(obligationRepository.findById(100L)).thenReturn(Optional.of(rent));
        when(occurrenceRepository.findByRecurringObligationIdAndCycleStartDate(100L, cycleStart))
                .thenReturn(Optional.of(pendingOcc));
        when(occurrenceRepository.save(any(ObligationOccurrence.class))).thenAnswer(inv -> inv.getArgument(0));

        ObligationOccurrenceResponse response = obligationService.skipObligation(100L);

        assertEquals(OccurrenceStatus.SKIPPED, response.status());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void testDeleteTransactionRevertsLinkedOccurrence() {
        Transaction tx = new Transaction(500L, user, rentCategory, new BigDecimal("15000.00"),
                TransactionType.EXPENSE, "Fulfillment: Apartment Rent", today);

        ObligationOccurrence paidOcc = new ObligationOccurrence(1L, rent, user,
                LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31),
                LocalDate.of(2026, 3, 20), new BigDecimal("15000.00"), OccurrenceStatus.PAID);
        paidOcc.setTransaction(tx);

        when(transactionRepository.findByIdAndUserId(500L, 1L)).thenReturn(Optional.of(tx));
        when(occurrenceRepository.findByTransactionId(500L)).thenReturn(Optional.of(paidOcc));

        transactionService.deleteTransaction(500L);

        // Occurrence must revert to PENDING since dueDate (2026-03-20) >= today (2026-03-13)
        assertEquals(OccurrenceStatus.PENDING, paidOcc.getStatus());
        assertNull(paidOcc.getTransaction());
        assertNull(paidOcc.getPaidAt());

        verify(occurrenceRepository).save(paidOcc);
        verify(transactionRepository).delete(tx);
    }
}
