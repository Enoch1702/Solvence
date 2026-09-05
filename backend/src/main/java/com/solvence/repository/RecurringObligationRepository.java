package com.solvence.repository;

import com.solvence.entity.RecurringObligation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecurringObligationRepository extends JpaRepository<RecurringObligation, Long> {

    List<RecurringObligation> findByUserIdAndIsActiveTrue(Long userId);

    List<RecurringObligation> findByUserId(Long userId);

    Optional<RecurringObligation> findByIdAndUserId(Long id, Long userId);
}
