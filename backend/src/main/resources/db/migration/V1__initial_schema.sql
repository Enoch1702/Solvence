-- ====================================================================
-- SOLVENCE SCHEMA - V1 INITIAL MIGRATION
-- Precision: NUMERIC for financial fields
-- Integrity: Cascades on user deletion, RESTRICT on category deletion
-- ====================================================================

-- 1. USERS TABLE
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    hourly_rate NUMERIC(10, 2),
    cycle_start_day INT NOT NULL CHECK (cycle_start_day BETWEEN 1 AND 31),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    is_essential BOOLEAN NOT NULL DEFAULT FALSE,
    slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique indexes:
-- System categories: slug must be unique among system categories (user_id IS NULL)
CREATE UNIQUE INDEX idx_categories_system_slug ON categories (slug) WHERE user_id IS NULL;

-- User categories: (user_id, slug) must be unique for each user
CREATE UNIQUE INDEX idx_categories_user_slug ON categories (user_id, slug) WHERE user_id IS NOT NULL;

-- 3. RECURRING OBLIGATIONS TABLE
CREATE TABLE recurring_obligations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    due_day INT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    frequency VARCHAR(20) NOT NULL CHECK (frequency = 'MONTHLY'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Query index for active obligations per user
CREATE INDEX idx_recurring_obligations_user_active ON recurring_obligations(user_id, is_active);

-- 4. TRANSACTIONS TABLE
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    description VARCHAR(255),
    transaction_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Query index for user transactions ordered newest first
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
