package com.solvence.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "INR";

    @Column(name = "opening_balance", nullable = false, precision = 14, scale = 2)
    private BigDecimal openingBalance = BigDecimal.ZERO;

    @Column(name = "opening_balance_effective_date", nullable = false)
    private LocalDate openingBalanceEffectiveDate = LocalDate.now();

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "pay_cycle_type", nullable = false, length = 20)
    private PayCycleType payCycleType = PayCycleType.MONTHLY;

    @Column(name = "pay_cycle_start_day")
    private Integer payCycleStartDay;

    @Column(name = "pay_cycle_anchor_date")
    private LocalDate payCycleAnchorDate;

    @Column(name = "pay_cycle_second_day")
    private Integer payCycleSecondDay;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public User() {
    }

    public User(Long id, String name, String email, String passwordHash, String currency,
                BigDecimal openingBalance, BigDecimal hourlyRate, Integer payCycleStartDay) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.currency = currency != null ? currency : "INR";
        this.openingBalance = openingBalance != null ? openingBalance : BigDecimal.ZERO;
        this.openingBalanceEffectiveDate = LocalDate.now();
        this.hourlyRate = hourlyRate;
        this.payCycleType = PayCycleType.MONTHLY;
        this.payCycleStartDay = payCycleStartDay;
        this.createdAt = Instant.now();
    }

    public User(Long id, String name, String email, String passwordHash, String currency,
                BigDecimal openingBalance, LocalDate openingBalanceEffectiveDate, BigDecimal hourlyRate,
                PayCycleType payCycleType, Integer payCycleStartDay, LocalDate payCycleAnchorDate, Integer payCycleSecondDay) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.currency = currency != null ? currency : "INR";
        this.openingBalance = openingBalance != null ? openingBalance : BigDecimal.ZERO;
        this.openingBalanceEffectiveDate = openingBalanceEffectiveDate != null ? openingBalanceEffectiveDate : LocalDate.now();
        this.hourlyRate = hourlyRate;
        this.payCycleType = payCycleType != null ? payCycleType : PayCycleType.MONTHLY;
        this.payCycleStartDay = payCycleStartDay;
        this.payCycleAnchorDate = payCycleAnchorDate;
        this.payCycleSecondDay = payCycleSecondDay;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getOpeningBalance() {
        return openingBalance;
    }

    public void setOpeningBalance(BigDecimal openingBalance) {
        this.openingBalance = openingBalance;
    }

    public LocalDate getOpeningBalanceEffectiveDate() {
        return openingBalanceEffectiveDate;
    }

    public void setOpeningBalanceEffectiveDate(LocalDate openingBalanceEffectiveDate) {
        this.openingBalanceEffectiveDate = openingBalanceEffectiveDate;
    }

    public BigDecimal getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(BigDecimal hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public PayCycleType getPayCycleType() {
        return payCycleType;
    }

    public void setPayCycleType(PayCycleType payCycleType) {
        this.payCycleType = payCycleType;
    }

    public Integer getPayCycleStartDay() {
        return payCycleStartDay;
    }

    public void setPayCycleStartDay(Integer payCycleStartDay) {
        this.payCycleStartDay = payCycleStartDay;
    }

    public LocalDate getPayCycleAnchorDate() {
        return payCycleAnchorDate;
    }

    public void setPayCycleAnchorDate(LocalDate payCycleAnchorDate) {
        this.payCycleAnchorDate = payCycleAnchorDate;
    }

    public Integer getPayCycleSecondDay() {
        return payCycleSecondDay;
    }

    public void setPayCycleSecondDay(Integer payCycleSecondDay) {
        this.payCycleSecondDay = payCycleSecondDay;
    }

    // Compatibility adapter for legacy references
    public Integer getCycleStartDay() {
        return payCycleStartDay;
    }

    public void setCycleStartDay(Integer cycleStartDay) {
        this.payCycleStartDay = cycleStartDay;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
