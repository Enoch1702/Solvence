package com.solvence.service;

import com.solvence.dto.CreateObligationRequest;
import com.solvence.dto.FulfillObligationRequest;
import com.solvence.dto.ObligationOccurrenceResponse;
import com.solvence.dto.ObligationResponse;
import com.solvence.dto.UpdateObligationRequest;
import com.solvence.entity.Category;
import com.solvence.entity.ObligationOccurrence;
import com.solvence.entity.OccurrenceStatus;
import com.solvence.entity.RecurringObligation;
import com.solvence.entity.Transaction;
import com.solvence.entity.TransactionType;
import com.solvence.entity.User;
import com.solvence.exception.BusinessValidationException;
import com.solvence.exception.ForbiddenException;
import com.solvence.exception.ResourceNotFoundException;
import com.solvence.repository.CategoryRepository;
import com.solvence.repository.ObligationOccurrenceRepository;
import com.solvence.repository.RecurringObligationRepository;
import com.solvence.repository.TransactionRepository;
import com.solvence.repository.UserRepository;
import com.solvence.security.CurrentUserProvider;
import com.solvence.service.runway.OccurrenceGenerationService;
import com.solvence.service.runway.PayCycle;
import com.solvence.service.runway.PayCycleEngine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ObligationService {

    private final RecurringObligationRepository obligationRepository;
    private final ObligationOccurrenceRepository occurrenceRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final CurrentUserProvider currentUserProvider;
    private final PayCycleEngine payCycleEngine;
    private final OccurrenceGenerationService occurrenceGenerationService;
    private final Clock clock;

    public ObligationService(RecurringObligationRepository obligationRepository,
                             ObligationOccurrenceRepository occurrenceRepository,
                             CategoryRepository categoryRepository,
                             UserRepository userRepository,
                             TransactionRepository transactionRepository,
                             CurrentUserProvider currentUserProvider,
                             PayCycleEngine payCycleEngine,
                             OccurrenceGenerationService occurrenceGenerationService,
                             Clock clock) {
        this.obligationRepository = obligationRepository;
        this.occurrenceRepository = occurrenceRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.currentUserProvider = currentUserProvider;
        this.payCycleEngine = payCycleEngine;
        this.occurrenceGenerationService = occurrenceGenerationService;
        this.clock = clock;
    }

    @Transactional
    public ObligationResponse createObligation(CreateObligationRequest request) {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.categoryId()));

        validateCategoryAccess(category, currentUserId);

        RecurringObligation obligation = new RecurringObligation();
        obligation.setUser(user);
        obligation.setCategory(category);
        obligation.setName(request.name().trim());
        obligation.setAmount(request.amount());
        obligation.setDueDay(request.dueDay());
        obligation.setActive(true);
        obligation.setNotes(request.notes() != null ? request.notes().trim() : null);

        RecurringObligation saved = obligationRepository.save(obligation);

        // Sync occurrences for current cycle
        LocalDate today = LocalDate.now(clock);
        PayCycle cycle = payCycleEngine.calculateCycle(user, today);
        occurrenceGenerationService.generateOccurrencesForCycle(user, cycle.startDate(), cycle.endDate(), today);

        Optional<ObligationOccurrence> currentOcc = occurrenceRepository
                .findByRecurringObligationIdAndCycleStartDate(saved.getId(), cycle.startDate());

        return ObligationResponse.fromEntity(
                saved,
                currentOcc.map(ObligationOccurrence::getStatus).orElse(null),
                currentOcc.map(ObligationOccurrence::getId).orElse(null)
        );
    }

    @Transactional
    public List<ObligationResponse> getObligations() {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        LocalDate today = LocalDate.now(clock);
        PayCycle cycle = payCycleEngine.calculateCycle(user, today);
        occurrenceGenerationService.generateOccurrencesForCycle(user, cycle.startDate(), cycle.endDate(), today);

        List<RecurringObligation> obligations = obligationRepository.findByUserId(currentUserId);
        List<ObligationResponse> responses = new ArrayList<>();

        for (RecurringObligation obligation : obligations) {
            Optional<ObligationOccurrence> occ = occurrenceRepository
                    .findByRecurringObligationIdAndCycleStartDate(obligation.getId(), cycle.startDate());
            responses.add(ObligationResponse.fromEntity(
                    obligation,
                    occ.map(ObligationOccurrence::getStatus).orElse(null),
                    occ.map(ObligationOccurrence::getId).orElse(null)
            ));
        }

        return responses;
    }

    @Transactional
    public ObligationResponse updateObligation(Long id, UpdateObligationRequest request) {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        RecurringObligation obligation = obligationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring obligation not found with ID: " + id));

        if (!obligation.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Cannot access obligation belonging to another user");
        }

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.categoryId()));
            validateCategoryAccess(category, currentUserId);
            obligation.setCategory(category);
        }

        if (request.name() != null && !request.name().trim().isEmpty()) {
            obligation.setName(request.name().trim());
        }
        if (request.amount() != null) {
            obligation.setAmount(request.amount());
        }
        if (request.dueDay() != null) {
            obligation.setDueDay(request.dueDay());
        }
        if (request.notes() != null) {
            obligation.setNotes(request.notes().trim());
        }
        if (request.isActive() != null) {
            boolean wasActive = obligation.isActive();
            obligation.setActive(request.isActive());
            if (wasActive && !request.isActive()) {
                // Remove unpaid occurrences when deactivating
                List<ObligationOccurrence> occurrences = occurrenceRepository.findByRecurringObligationId(obligation.getId());
                for (ObligationOccurrence occ : occurrences) {
                    if (occ.getStatus() == OccurrenceStatus.PENDING || occ.getStatus() == OccurrenceStatus.OVERDUE) {
                        occurrenceRepository.delete(occ);
                    }
                }
            }
        }

        RecurringObligation saved = obligationRepository.save(obligation);

        LocalDate today = LocalDate.now(clock);
        PayCycle cycle = payCycleEngine.calculateCycle(obligation.getUser(), today);
        if (saved.isActive()) {
            occurrenceGenerationService.generateOccurrencesForCycle(obligation.getUser(), cycle.startDate(), cycle.endDate(), today);
        }

        Optional<ObligationOccurrence> currentOcc = occurrenceRepository
                .findByRecurringObligationIdAndCycleStartDate(saved.getId(), cycle.startDate());

        return ObligationResponse.fromEntity(
                saved,
                currentOcc.map(ObligationOccurrence::getStatus).orElse(null),
                currentOcc.map(ObligationOccurrence::getId).orElse(null)
        );
    }

    @Transactional
    public void deleteObligation(Long id) {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        RecurringObligation obligation = obligationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring obligation not found with ID: " + id));

        if (!obligation.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Cannot access obligation belonging to another user");
        }

        obligationRepository.delete(obligation);
    }

    @Transactional
    public ObligationOccurrenceResponse fulfillObligation(Long id, FulfillObligationRequest request) {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        RecurringObligation obligation = obligationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring obligation not found with ID: " + id));

        if (!obligation.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Cannot access obligation belonging to another user");
        }

        User user = obligation.getUser();
        LocalDate today = LocalDate.now(clock);
        PayCycle cycle = payCycleEngine.calculateCycle(user, today);
        occurrenceGenerationService.generateOccurrencesForCycle(user, cycle.startDate(), cycle.endDate(), today);

        ObligationOccurrence occurrence = occurrenceRepository
                .findByRecurringObligationIdAndCycleStartDate(id, cycle.startDate())
                .orElseThrow(() -> new ResourceNotFoundException("No occurrence found for obligation in current cycle"));

        if (occurrence.getStatus() == OccurrenceStatus.PAID) {
            throw new BusinessValidationException("Obligation occurrence is already marked as PAID");
        }

        BigDecimal paymentAmount = (request != null && request.paymentAmount() != null)
                ? request.paymentAmount()
                : occurrence.getAmount();

        LocalDate paymentDate = (request != null && request.paymentDate() != null)
                ? request.paymentDate()
                : today;

        Transaction transaction = new Transaction(
                null,
                user,
                obligation.getCategory(),
                paymentAmount,
                TransactionType.EXPENSE,
                "Fulfillment: " + obligation.getName(),
                paymentDate
        );

        Transaction savedTransaction = transactionRepository.save(transaction);

        occurrence.setStatus(OccurrenceStatus.PAID);
        occurrence.setTransaction(savedTransaction);
        occurrence.setPaidAt(Instant.now(clock));
        ObligationOccurrence savedOccurrence = occurrenceRepository.save(occurrence);

        return ObligationOccurrenceResponse.fromEntity(savedOccurrence);
    }

    @Transactional
    public ObligationOccurrenceResponse skipObligation(Long id) {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        RecurringObligation obligation = obligationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring obligation not found with ID: " + id));

        if (!obligation.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Cannot access obligation belonging to another user");
        }

        User user = obligation.getUser();
        LocalDate today = LocalDate.now(clock);
        PayCycle cycle = payCycleEngine.calculateCycle(user, today);
        occurrenceGenerationService.generateOccurrencesForCycle(user, cycle.startDate(), cycle.endDate(), today);

        ObligationOccurrence occurrence = occurrenceRepository
                .findByRecurringObligationIdAndCycleStartDate(id, cycle.startDate())
                .orElseThrow(() -> new ResourceNotFoundException("No occurrence found for obligation in current cycle"));

        if (occurrence.getStatus() == OccurrenceStatus.PAID) {
            throw new BusinessValidationException("Cannot skip an obligation that has already been PAID");
        }

        occurrence.setStatus(OccurrenceStatus.SKIPPED);
        ObligationOccurrence saved = occurrenceRepository.save(occurrence);
        return ObligationOccurrenceResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ObligationOccurrenceResponse> getCurrentCycleOccurrences() {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        LocalDate today = LocalDate.now(clock);
        PayCycle cycle = payCycleEngine.calculateCycle(user, today);

        return occurrenceRepository.findCurrentCycleOccurrences(currentUserId, cycle.startDate())
                .stream()
                .map(ObligationOccurrenceResponse::fromEntity)
                .toList();
    }

    private void validateCategoryAccess(Category category, Long currentUserId) {
        if (!category.isSystemCategory() && (category.getUser() == null || !category.getUser().getId().equals(currentUserId))) {
            throw new ForbiddenException("Cannot use category belonging to another user");
        }
    }
}
