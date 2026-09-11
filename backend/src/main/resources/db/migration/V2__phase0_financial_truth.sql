-- ====================================================================
-- SOLVENCE SCHEMA - V2 PHASE 0 FINANCIAL TRUTH & OCCURRENCE ENGINE
-- Migration: Pay cycle expansion, opening balance baseline, and obligation occurrences
-- ====================================================================

-- 1. EXTEND USERS TABLE FOR FINANCIAL TRUTH & PAY CYCLES
ALTER TABLE users ADD COLUMN opening_balance_effective_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE users ADD COLUMN pay_cycle_type VARCHAR(20) NOT NULL DEFAULT 'MONTHLY' CHECK (pay_cycle_type IN ('MONTHLY', 'BIWEEKLY', 'SEMI_MONTHLY'));
ALTER TABLE users ADD COLUMN pay_cycle_start_day INT NULL CHECK (pay_cycle_start_day BETWEEN 1 AND 31);
ALTER TABLE users ADD COLUMN pay_cycle_anchor_date DATE NULL;
ALTER TABLE users ADD COLUMN pay_cycle_second_day INT NULL CHECK (pay_cycle_second_day BETWEEN 1 AND 31);

-- Backfill pay_cycle_start_day from legacy cycle_start_day
UPDATE users SET pay_cycle_start_day = cycle_start_day, pay_cycle_type = 'MONTHLY', opening_balance_effective_date = CURRENT_DATE WHERE pay_cycle_start_day IS NULL;

-- Remove legacy cycle_start_day to eliminate competing sources of truth
ALTER TABLE users DROP COLUMN cycle_start_day;

-- 2. EXTEND RECURRING OBLIGATIONS
ALTER TABLE recurring_obligations ADD COLUMN notes VARCHAR(255) NULL;

-- 3. CREATE OBLIGATION OCCURRENCES TABLE
CREATE TABLE obligation_occurrences (
    id BIGSERIAL PRIMARY KEY,
    recurring_obligation_id BIGINT NOT NULL REFERENCES recurring_obligations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cycle_start_date DATE NOT NULL,
    cycle_end_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'OVERDUE', 'PAID', 'SKIPPED')),
    transaction_id BIGINT NULL REFERENCES transactions(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_obligation_occurrence_cycle UNIQUE (recurring_obligation_id, cycle_start_date)
);

-- Query index for occurrences within a cycle
CREATE INDEX idx_obligation_occurrences_user_cycle ON obligation_occurrences(user_id, cycle_start_date, cycle_end_date);

-- Query index for committed calculation by status
CREATE INDEX idx_obligation_occurrences_status ON obligation_occurrences(user_id, status);

-- Query index for reverse lookup from transaction to occurrence
CREATE INDEX idx_obligation_occurrences_transaction_id ON obligation_occurrences(transaction_id);
