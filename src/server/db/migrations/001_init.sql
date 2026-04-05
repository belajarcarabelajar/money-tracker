-- Money Tracker Database Schema
-- PostgreSQL 18.3

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('Income', 'Expense')),
    date DATE NOT NULL,
    time TIME NOT NULL,
    timestamp BIGINT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User balances table (denormalized for fast reads)
CREATE TABLE IF NOT EXISTS user_balances (
    user_id VARCHAR(255) PRIMARY KEY,
    total_income BIGINT DEFAULT 0,
    total_expense BIGINT DEFAULT 0,
    balance BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Function to update user balance
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'Income' THEN
            UPDATE user_balances
            SET total_income = total_income + NEW.amount,
                balance = balance + NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
            IF NOT FOUND THEN
                INSERT INTO user_balances (user_id, total_income, balance)
                VALUES (NEW.user_id, NEW.amount, NEW.amount);
            END IF;
        ELSIF NEW.type = 'Expense' THEN
            UPDATE user_balances
            SET total_expense = total_expense + NEW.amount,
                balance = balance - NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
            IF NOT FOUND THEN
                INSERT INTO user_balances (user_id, total_expense, balance)
                VALUES (NEW.user_id, NEW.amount, -NEW.amount);
            END IF;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'Income' THEN
            UPDATE user_balances
            SET total_income = total_income - OLD.amount,
                balance = balance - OLD.amount,
                updated_at = NOW()
            WHERE user_id = OLD.user_id;
        ELSIF OLD.type = 'Expense' THEN
            UPDATE user_balances
            SET total_expense = total_expense - OLD.amount,
                balance = balance + OLD.amount,
                updated_at = NOW()
            WHERE user_id = OLD.user_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for balance update
DROP TRIGGER IF EXISTS trigger_update_balance ON transactions;
CREATE TRIGGER trigger_update_balance
AFTER INSERT OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_user_balance();

-- Seed data for testing (optional)
-- INSERT INTO transactions (user_id, amount, description, category, type, date, time, timestamp)
-- VALUES ('demo', 100000, 'Gaji', 'Sponsorship & Brand Deals', 'Income', CURRENT_DATE, CURRENT_TIME, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000);
