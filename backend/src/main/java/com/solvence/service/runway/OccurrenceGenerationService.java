package com.solvence.service.runway;

import com.solvence.entity.ObligationOccurrence;
import com.solvence.entity.OccurrenceStatus;
import com.solvence.entity.RecurringObligation;
import com.solvence.entity.User;
import com.solvence.repository.ObligationOccurrenceRepository;
import com.solvence.repository.RecurringObligationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class OccurrenceGenerationService {

    private final ObligationOccurrenceRepository occurrenceRepository;
    private final RecurringObligationRepository obligationRepository;
    private final Clock clock;

    public OccurrenceGenerationService(ObligationOccurrenceRepository occurrenceRepository,
                                       RecurringObligationRepository obligationRepository,
                                       Clock clock) {
        this.occurrenceRepository = occurrenceRepository;
        this.obligationRepository = obligationRepository;
        this.clock = clock;
    }

    @Transactional
    public List<ObligationOccurrence> generateOccurrencesForCycle(User user, LocalDate cycleStart, LocalDate cycleEnd) {
        return generateOccurrencesForCycle(user, cycleStart, cycleEnd, LocalDate.now(clock));
    }

    @Transactional
    public List<ObligationOccurrence> generateOccurrencesForCycle(User user, LocalDate cycleStart, LocalDate cycleEnd, LocalDate today) {
        List<RecurringObligation> obligations = obligationRepository.findByUserIdAndIsActiveTrue(user.getId());
        List<ObligationOccurrence> result = new ArrayList<>();

        for (RecurringObligation obligation : obligations) {
            LocalDate dueDate = computeDueDateForCycle(obligation, cycleStart, cycleEnd);
            if (dueDate == null) {
                continue;
            }

            Optional<ObligationOccurrence> existingOpt = occurrenceRepository
                    .findByRecurringObligationIdAndCycleStartDate(obligation.getId(), cycleStart);

            if (existingOpt.isPresent()) {
                ObligationOccurrence occurrence = existingOpt.get();
                if (occurrence.getStatus() == OccurrenceStatus.PENDING || occurrence.getStatus() == OccurrenceStatus.OVERDUE) {
                    occurrence.setAmount(obligation.getAmount());
                    occurrence.setDueDate(dueDate);
                    occurrence.setCycleEndDate(cycleEnd);
                    if (dueDate.isBefore(today)) {
                        occurrence.setStatus(OccurrenceStatus.OVERDUE);
                    } else {
                        occurrence.setStatus(OccurrenceStatus.PENDING);
                    }
                    occurrence = occurrenceRepository.save(occurrence);
                }
                result.add(occurrence);
            } else {
                OccurrenceStatus status = dueDate.isBefore(today) ? OccurrenceStatus.OVERDUE : OccurrenceStatus.PENDING;
                ObligationOccurrence occurrence = new ObligationOccurrence(
                        null,
                        obligation,
                        user,
                        cycleStart,
                        cycleEnd,
                        dueDate,
                        obligation.getAmount(),
                        status
                );
                occurrence = occurrenceRepository.save(occurrence);
                result.add(occurrence);
            }
        }

        return result;
    }

    public LocalDate computeDueDateForCycle(RecurringObligation obligation, LocalDate cycleStart, LocalDate cycleEnd) {
        if (obligation.getDueDay() == null) {
            return null;
        }

        YearMonth startYm = YearMonth.from(cycleStart);
        YearMonth endYm = YearMonth.from(cycleEnd);

        YearMonth currentYm = startYm;
        while (!currentYm.isAfter(endYm)) {
            int clampedDay = Math.min(obligation.getDueDay(), currentYm.lengthOfMonth());
            LocalDate candidate = currentYm.atDay(clampedDay);
            if (!candidate.isBefore(cycleStart) && !candidate.isAfter(cycleEnd)) {
                return candidate;
            }
            currentYm = currentYm.plusMonths(1);
        }

        return null;
    }
}
