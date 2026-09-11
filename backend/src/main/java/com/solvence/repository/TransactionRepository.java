package com.solvence.repository;

import com.solvence.entity.Transaction;
import com.solvence.entity.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserIdOrderByTransactionDateDescCreatedAtDesc(Long userId);

    Optional<Transaction> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COALESCE(SUM(t.amount), 0.00) FROM Transaction t WHERE t.user.id = :userId AND t.type = :type")
    BigDecimal sumAmountByUserIdAndType(@Param("userId") Long userId, @Param("type") TransactionType type);

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0.00)
        FROM Transaction t
        WHERE t.user.id = :userId
          AND t.type = :type
          AND t.transactionDate > :fromDateExclusive
          AND t.transactionDate <= :toDateInclusive
    """)
    BigDecimal sumAmountByUserIdAndTypeAndDateRange(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("fromDateExclusive") LocalDate fromDateExclusive,
            @Param("toDateInclusive") LocalDate toDateInclusive
    );

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0.00)
        FROM Transaction t
        WHERE t.user.id = :userId
          AND t.type = :type
          AND t.transactionDate <= :asOfDate
    """)
    BigDecimal sumAmountByUserIdAndTypeAndDateBeforeEqual(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("asOfDate") LocalDate asOfDate
    );

    @Query("SELECT t.transactionDate, t.type, SUM(t.amount) " +
           "FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY t.transactionDate, t.type " +
           "ORDER BY t.transactionDate ASC")
    List<Object[]> findDailyTotalsByUserIdAndDateBetween(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT c.id, c.name, SUM(t.amount) " +
           "FROM Transaction t " +
           "JOIN t.category c " +
           "WHERE t.user.id = :userId " +
           "AND t.type = :type " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY c.id, c.name " +
           "ORDER BY SUM(t.amount) DESC")
    List<Object[]> findCategoryTotalsByUserIdAndTypeAndDateBetween(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT t.type, SUM(t.amount), COUNT(t.id) " +
           "FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY t.type")
    List<Object[]> findCashflowTotalsByUserIdAndDateBetween(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
