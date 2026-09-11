package com.solvence.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "obligation_occurrences", uniqueConstraints = {
        @UniqueConstraint(name = "uq_obligation_occurrence_cycle", columnNames = {"recurring_obligation_id", "cycle_start_date"})
})
public class ObligationOccurrence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recurring_obligation_id", nullable = false)
    private RecurringObligation recurringObligation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "cycle_start_date", nullable = false)
    private LocalDate cycleStartDate;

    @Column(name = "cycle_end_date", nullable = false)
    private LocalDate cycleEndDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OccurrenceStatus status = OccurrenceStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    private Transaction transaction;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ObligationOccurrence() {
    }

    public ObligationOccurrence(Long id, RecurringObligation recurringObligation, User user,
                                LocalDate cycleStartDate, LocalDate cycleEndDate, LocalDate dueDate,
                                BigDecimal amount, OccurrenceStatus status) {
        this.id = id;
        this.recurringObligation = recurringObligation;
        this.user = user;
        this.cycleStartDate = cycleStartDate;
        this.cycleEndDate = cycleEndDate;
        this.dueDate = dueDate;
        this.amount = amount;
        this.status = status != null ? status : OccurrenceStatus.PENDING;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RecurringObligation getRecurringObligation() {
        return recurringObligation;
    }

    public void setRecurringObligation(RecurringObligation recurringObligation) {
        this.recurringObligation = recurringObligation;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDate getCycleStartDate() {
        return cycleStartDate;
    }

    public void setCycleStartDate(LocalDate cycleStartDate) {
        this.cycleStartDate = cycleStartDate;
    }

    public LocalDate getCycleEndDate() {
        return cycleEndDate;
    }

    public void setCycleEndDate(LocalDate cycleEndDate) {
        this.cycleEndDate = cycleEndDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public OccurrenceStatus getStatus() {
        return status;
    }

    public void setStatus(OccurrenceStatus status) {
        this.status = status;
    }

    public Transaction getTransaction() {
        return transaction;
    }

    public void setTransaction(Transaction transaction) {
        this.transaction = transaction;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(Instant paidAt) {
        this.paidAt = paidAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
