package com.solvence.repository;

import com.solvence.entity.ObligationOccurrence;
import com.solvence.entity.OccurrenceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ObligationOccurrenceRepository extends JpaRepository<ObligationOccurrence, Long> {

    List<ObligationOccurrence> findByUserIdAndCycleStartDate(Long userId, LocalDate cycleStartDate);

    Optional<ObligationOccurrence> findByRecurringObligationIdAndCycleStartDate(Long recurringObligationId, LocalDate cycleStartDate);

    Optional<ObligationOccurrence> findByTransactionId(Long transactionId);

    List<ObligationOccurrence> findByUserIdAndRecurringObligationId(Long userId, Long recurringObligationId);

    List<ObligationOccurrence> findByRecurringObligationId(Long recurringObligationId);

    @Query("""
        SELECT COALESCE(SUM(o.amount), 0.00)
        FROM ObligationOccurrence o
        WHERE o.user.id = :userId
          AND o.cycleStartDate = :cycleStartDate
          AND o.status IN :statuses
    """)
    BigDecimal sumAmountByUserIdAndCycleAndStatusIn(
            @Param("userId") Long userId,
            @Param("cycleStartDate") LocalDate cycleStartDate,
            @Param("statuses") Collection<OccurrenceStatus> statuses
    );

    @Query("""
        SELECT o
        FROM ObligationOccurrence o
        WHERE o.user.id = :userId
          AND o.cycleStartDate = :cycleStartDate
        ORDER BY o.dueDate ASC
    """)
    List<ObligationOccurrence> findCurrentCycleOccurrences(
            @Param("userId") Long userId,
            @Param("cycleStartDate") LocalDate cycleStartDate
    );
}
